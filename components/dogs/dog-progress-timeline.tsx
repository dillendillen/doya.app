"use client";

import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DogMilestone, DogProgressScore } from "@/lib/data/dog-progress";
import { useState } from "react";

type DogProgressTimelineProps = {
  milestones: DogMilestone[];
  progressScores: DogProgressScore[];
};

export function DogProgressTimeline({ milestones, progressScores }: DogProgressTimelineProps) {
  const [showGraph, setShowGraph] = useState(false);

  // Calculate average scores if we have data
  const avgObedience = progressScores.length > 0
    ? progressScores.reduce((sum, s) => sum + s.obedience, 0) / progressScores.length
    : null;
  const avgFocus = progressScores.length > 0
    ? progressScores.reduce((sum, s) => sum + s.focus, 0) / progressScores.length
    : null;
  const avgSocial = progressScores.length > 0
    ? progressScores.reduce((sum, s) => sum + s.socialTolerance, 0) / progressScores.length
    : null;

  return (
    <Card title="Progress Timeline">
      <div className="space-y-6">
        {/* Progress Graph Toggle */}
        {progressScores.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-brand-secondary">Progress Overview</p>
            <button
              onClick={() => setShowGraph(!showGraph)}
              className="text-xs text-brand-primary hover:underline"
            >
              {showGraph ? "Hide Graph" : "Show Graph"}
            </button>
          </div>
        )}

        {/* Progress Graph */}
        {showGraph && progressScores.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                  <span>Obedience</span>
                  <span className="font-semibold">{avgObedience?.toFixed(1) ?? "N/A"}/10</span>
                </div>
                <div className="h-3 w-full rounded-full bg-neutral-200">
                  <div
                    className="h-3 rounded-full bg-brand-primary transition-all"
                    style={{ width: `${((avgObedience ?? 0) / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                  <span>Focus</span>
                  <span className="font-semibold">{avgFocus?.toFixed(1) ?? "N/A"}/10</span>
                </div>
                <div className="h-3 w-full rounded-full bg-neutral-200">
                  <div
                    className="h-3 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${((avgFocus ?? 0) / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
                  <span>Social Tolerance</span>
                  <span className="font-semibold">{avgSocial?.toFixed(1) ?? "N/A"}/10</span>
                </div>
                <div className="h-3 w-full rounded-full bg-neutral-200">
                  <div
                    className="h-3 rounded-full bg-amber-500 transition-all"
                    style={{ width: `${((avgSocial ?? 0) / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Milestones */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-secondary">Milestones 🦮</h3>
          {milestones.length === 0 ? (
            <p className="text-sm text-neutral-500">No milestones recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        <p className="font-semibold text-brand-secondary">{milestone.title}</p>
                        {milestone.score !== undefined && (
                          <Badge variant="success">{milestone.score}/10</Badge>
                        )}
                      </div>
                      {milestone.description && (
                        <p className="mt-1 text-sm text-neutral-600">{milestone.description}</p>
                      )}
                      <p className="mt-2 text-xs text-neutral-500">
                        Achieved on {format(parseISO(milestone.achievedAt), "MMM d, yyyy")}
                      </p>
                      {milestone.mediaIds.length > 0 && (
                        <p className="mt-1 text-xs text-neutral-500">
                          📷 {milestone.mediaIds.length} photo(s)/video(s)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Behavior Logs Summary */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-brand-secondary">Recent Progress</h3>
          {progressScores.length === 0 ? (
            <p className="text-sm text-neutral-500">No progress scores recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {progressScores.slice(-5).reverse().map((score, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                >
                  <span className="text-neutral-600">
                    {format(parseISO(score.date), "MMM d, yyyy")}
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span>Obedience: {score.obedience}/10</span>
                    <span>Focus: {score.focus}/10</span>
                    <span>Social: {score.socialTolerance}/10</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


