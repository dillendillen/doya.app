import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const SESSION_STATUS_VALUES = ["SCHEDULED", "IN_PROGRESS", "DONE"] as const;

const updateSessionSchema = z
  .object({
    objective: z
      .string()
      .trim()
      .min(1, "Objective cannot be empty.")
      .optional(),
    objectives: z
      .array(z.string().trim().min(1, "Objectives cannot be empty entries."))
      .optional(),
    note: z
      .string()
      .trim()
      .min(1, "Note cannot be empty.")
      .optional(),
    linkNoteToDog: z.boolean().optional().default(false),
    title: z
      .union([z.string(), z.null()])
      .optional()
      .transform((val) => {
        if (typeof val === "string") {
          const trimmed = val.trim();
          return trimmed.length > 0 ? trimmed : null;
        }
        return val ?? undefined;
      }),
    sessionNote: z.union([z.string(), z.null()]).optional(),
    startTime: z
      .string()
      .trim()
      .min(1, "Start time must be provided when updating.")
      .optional(),
    durationMinutes: z
      .number()
      .int("Duration must be an integer.")
      .min(1, "Duration must be at least 1 minute.")
      .optional(),
    location: z
      .string()
      .trim()
      .min(1, "Location cannot be empty when provided.")
      .optional(),
    status: z.enum(SESSION_STATUS_VALUES).optional(),
    trainerId: z
      .string()
      .trim()
      .min(1, "Trainer ID cannot be empty when provided.")
      .optional(),
    travelMinutes: z
      .number()
      .int("Travel minutes must be an integer.")
      .min(0, "Travel minutes cannot be negative.")
      .optional(),
    bufferMinutes: z
      .number()
      .int("Buffer minutes must be an integer.")
      .min(0, "Buffer minutes cannot be negative.")
      .optional(),
    packageId: z
      .union([z.string().trim().min(1), z.null()])
      .optional(),
  })
  .superRefine((value, ctx) => {
    let hasUpdate =
      value.objective !== undefined ||
      value.objectives !== undefined ||
      value.note !== undefined ||
      value.startTime !== undefined ||
      value.durationMinutes !== undefined ||
      value.location !== undefined ||
      value.status !== undefined ||
      value.trainerId !== undefined ||
      value.travelMinutes !== undefined ||
      value.bufferMinutes !== undefined ||
      value.title !== undefined ||
      value.packageId !== undefined;
    if (value.sessionNote !== undefined) {
      hasUpdate = true;
    }

    if (!hasUpdate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one field to update.",
      });
    }
  });

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  const { id: sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const payload = updateSessionSchema.parse(body);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        dogId: true,
        clientId: true,
        trainerId: true,
        objectives: true,
        notes: true,
        dog: {
          select: { clientId: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (payload.trainerId && payload.trainerId !== session.trainerId) {
      const trainer = await prisma.user.findUnique({
        where: { id: payload.trainerId },
        select: { id: true },
      });

      if (!trainer) {
        return NextResponse.json({ error: "Trainer not found." }, { status: 404 });
      }
    }

    let parsedStart: Date | undefined;
    if (payload.startTime !== undefined) {
      const start = new Date(payload.startTime);
      if (Number.isNaN(start.getTime())) {
        return NextResponse.json({ error: "Invalid start time." }, { status: 400 });
      }
      parsedStart = start;
    }

    const nextObjectives =
      payload.objectives !== undefined
        ? payload.objectives
        : payload.objective !== undefined
          ? [...session.objectives, payload.objective]
          : session.objectives;

    const trimmedStandaloneNote =
      typeof payload.note === "string" ? payload.note.trim() : undefined;

    let nextSessionNote = session.notes ?? null;

    if (payload.sessionNote !== undefined) {
      if (payload.sessionNote === null) {
        nextSessionNote = null;
      } else {
        const trimmedSessionNote = payload.sessionNote.trim();
        nextSessionNote = trimmedSessionNote.length > 0 ? trimmedSessionNote : null;
      }
    }

    if (trimmedStandaloneNote && !payload.linkNoteToDog) {
        nextSessionNote =
          nextSessionNote && nextSessionNote.length > 0
            ? `${nextSessionNote}\n\n${trimmedStandaloneNote}`
            : trimmedStandaloneNote;
    }

    // Extract current title from notes if it exists
    const currentNotes = session.notes ?? "";
    const currentTitle = currentNotes.split("\n")[0]?.trim() || null;
    const hasTitleFormat = currentNotes.split("\n").length > 1 && currentNotes.split("\n")[1]?.trim() === "";
    const currentNotesBody = hasTitleFormat ? currentNotes.split("\n").slice(2).join("\n").trim() : currentNotes;
    
    const nextTitle = payload.title !== undefined ? payload.title : currentTitle;

    await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (payload.objectives !== undefined || payload.objective !== undefined) {
        updateData.objectives = { set: nextObjectives };
      }

      if (
        payload.sessionNote !== undefined ||
        (trimmedStandaloneNote && !payload.linkNoteToDog)
      ) {
        // Preserve title if it exists when updating notes
        if (nextTitle && !payload.title) {
          updateData.notes = `${nextTitle}\n\n${nextSessionNote || ""}`.trim();
        } else {
          updateData.notes = nextSessionNote;
        }
      }

      if (parsedStart) {
        updateData.startTime = parsedStart;
      }

      if (payload.durationMinutes !== undefined) {
        updateData.durationMinutes = payload.durationMinutes;
      }

      if (payload.location !== undefined) {
        updateData.location = payload.location;
      }

      if (payload.status !== undefined) {
        updateData.status = payload.status;
      }

      if (payload.trainerId !== undefined) {
        updateData.trainerId = payload.trainerId;
      }

      if (payload.travelMinutes !== undefined) {
        updateData.travelMinutes = payload.travelMinutes;
      }

      if (payload.bufferMinutes !== undefined) {
        updateData.bufferMinutes = payload.bufferMinutes;
      }

      if (payload.title !== undefined) {
        // Update notes with new title format: "Title\n\nnotes body"
        const newNotesBody = nextSessionNote || currentNotesBody || "";
        updateData.notes = nextTitle 
          ? `${nextTitle}\n\n${newNotesBody}`.trim() 
          : newNotesBody || null;
      }

      if (payload.packageId !== undefined) {
        // Validate package exists and belongs to the client if provided
        if (payload.packageId) {
          const pkg = await tx.package.findUnique({
            where: { id: payload.packageId },
            select: { clientId: true, id: true },
          });

          if (!pkg) {
            throw new Error("Package not found.");
          }

          // Verify package belongs to the session's client
          const sessionClientId = session.clientId || session.dog?.clientId;
          if (pkg.clientId !== sessionClientId) {
            throw new Error("Package does not belong to this session's client.");
          }
        }
        updateData.packageId = payload.packageId;
      }

      if (Object.keys(updateData).length > 0) {
        await tx.session.update({
          where: { id: sessionId },
          data: updateData,
        });
      }

      // Handle package changes - if packageId is being changed, adjust reservations
      if (payload.packageId !== undefined) {
        const oldPackageId = session.packageId;
        const newPackageId = payload.packageId;

        // If removing package assignment, release the slot
        if (oldPackageId && !newPackageId) {
          await tx.package.update({
            where: { id: oldPackageId },
            data: {
              usedCredits: {
                decrement: 1,
              },
            },
          });
        }
        // If changing packages, release old and reserve new
        else if (oldPackageId && newPackageId && oldPackageId !== newPackageId) {
          // Release old package slot
          await tx.package.update({
            where: { id: oldPackageId },
            data: {
              usedCredits: {
                decrement: 1,
              },
            },
          });

          // Reserve new package slot
          const newPkg = await tx.package.findUnique({
            where: { id: newPackageId },
            select: { usedCredits: true, totalCredits: true },
          });

          if (newPkg && newPkg.usedCredits < newPkg.totalCredits) {
            await tx.package.update({
              where: { id: newPackageId },
              data: {
                usedCredits: {
                  increment: 1,
                },
              },
            });
          }
        }
        // If adding package for the first time, reserve slot
        else if (!oldPackageId && newPackageId) {
          const newPkg = await tx.package.findUnique({
            where: { id: newPackageId },
            select: { usedCredits: true, totalCredits: true },
          });

          if (newPkg && newPkg.usedCredits < newPkg.totalCredits) {
            await tx.package.update({
              where: { id: newPackageId },
              data: {
                usedCredits: {
                  increment: 1,
                },
              },
            });
          }
        }
      }

      // Log session update
      if (Object.keys(updateData).length > 0) {
        await createAuditLog({
          action: "SESSION_UPDATED",
          entityType: "session",
          entityId: sessionId,
          summary: `Session updated: ${Object.keys(updateData).join(", ")}`,
        });
      }

      if (trimmedStandaloneNote && payload.linkNoteToDog) {
        await tx.dogLog.create({
          data: {
            dogId: session.dogId,
            summary: trimmedStandaloneNote,
          },
        });

        const noteClientId = session.clientId ?? session.dog?.clientId;
        if (noteClientId) {
          await tx.clientNote.create({
            data: {
              clientId: noteClientId,
              body: trimmedStandaloneNote,
            },
          });
        }
      }
    });

    return NextResponse.json(
      {
        updated: true,
        objectives: nextObjectives,
        sessionNote: nextSessionNote,
        title: nextTitle,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 400 },
      );
    }

    console.error(`PATCH /api/sessions/${sessionId} failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update session.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured. Set DATABASE_URL to enable this action." },
      { status: 503 },
    );
  }

  const { id: sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  }

  try {
    // Check if session exists and get package info
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { 
        id: true,
        packageId: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Delete session and release package slot in a transaction
    await prisma.$transaction(async (tx) => {
      // If session has a package, release the slot
      if (session.packageId) {
        await tx.package.update({
          where: { id: session.packageId },
          data: {
            usedCredits: {
              decrement: 1,
            },
          },
        });
      }

      // Delete the session
      await tx.session.delete({
        where: { id: sessionId },
      });
    });

    // Log audit entry
    await createAuditLog({
      action: "SESSION_DELETED",
      entityType: "session",
      entityId: sessionId,
      summary: session.packageId ? "Session deleted, package slot released" : "Session deleted",
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/sessions/${sessionId} failed`, error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete session.",
      },
      { status: 500 },
    );
  }
}
