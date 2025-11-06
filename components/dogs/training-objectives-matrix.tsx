"use client";

import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DogTrainingObjective } from "@/lib/data/dog-progress";
import { EditObjectiveButton } from "./edit-objective-button";
import { DeleteObjectiveButton } from "./delete-objective-button";

type TrainingObjectivesMatrixProps = {
  objectives: DogTrainingObjective[];
  dogId: string;
  onEdit?: (objective: DogTrainingObjective) => void;
};

export function TrainingObjectivesMatrix({ objectives, dogId, onEdit }: TrainingObjectivesMatrixProps) {
  const planned = objectives.filter((o) => o.status === "planned");
  const inProgress = objectives.filter((o) => o.status === "in_progress");
  const mastered = objectives.filter((o) => o.status === "mastered");

  const getStatusColor = (status: DogTrainingObjective["status"]) => {
    switch (status) {
      case "planned":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "mastered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  const getStatusIcon = (status: DogTrainingObjective["status"]) => {
    switch (status) {
      case "planned":
        return "📋";
      case "in_progress":
        return "🔄";
      case "mastered":
        return "✅";
    }
  };

  return (
    <Card title="Training Objectives Matrix">
      <div className="space-y-6">
        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-2xl font-bold text-slate-700">{planned.length}</p>
            <p className="text-xs text-slate-600">Planned</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{inProgress.length}</p>
            <p className="text-xs text-blue-600">In Progress</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{mastered.length}</p>
            <p className="text-xs text-emerald-600">Mastered</p>
          </div>
        </div>

        {/* Objectives List */}
        {objectives.length === 0 ? (
          <p className="text-sm text-neutral-500">No training objectives set yet.</p>
        ) : (
          <div className="space-y-3">
            {objectives.map((objective) => (
              <div
                key={objective.id}
                className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${getStatusColor(objective.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(objective.status)}</span>
                      <p className="font-semibold">{objective.skill}</p>
                      <Badge
                        variant={
                          objective.status === "mastered"
                            ? "success"
                            : objective.status === "in_progress"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {objective.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {objective.notes && (
                      <p className="mt-2 text-sm opacity-90">{objective.notes}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs opacity-75">
                      {objective.startedAt && (
                        <span>
                          Started: {format(parseISO(objective.startedAt), "MMM d, yyyy")}
                        </span>
                      )}
                      {objective.masteredAt && (
                        <span>
                          Mastered: {format(parseISO(objective.masteredAt), "MMM d, yyyy")}
                        </span>
                      )}
                      {objective.sessionIds.length > 0 && (
                        <span>{objective.sessionIds.length} session(s)</span>
                      )}
                      {objective.mediaIds.length > 0 && (
                        <span>📷 {objective.mediaIds.length}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditObjectiveButton objective={objective} dogId={dogId} />
                    <DeleteObjectiveButton objectiveId={objective.id} dogId={dogId} skill={objective.skill} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}


