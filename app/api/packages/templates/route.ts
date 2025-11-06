import { NextResponse } from "next/server";
import { listPackageTemplates } from "@/lib/data/billing";

export async function GET() {
  try {
    const templates = await listPackageTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET /api/packages/templates failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch templates.",
      },
      { status: 500 },
    );
  }
}

