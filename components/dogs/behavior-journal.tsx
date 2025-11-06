"use client";

import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DogBehaviorLog } from "@/lib/data/dog-progress";
import { AddBehaviorLogButton } from "./add-behavior-log-button";
import { EditBehaviorLogButton } from "./edit-behavior-log-button";
import { DeleteBehaviorLogButton } from "./delete-behavior-log-button";
import { useState, useMemo } from "react";

type BehaviorJournalProps = {
  logs: DogBehaviorLog[];
  dogId: string;
};

const moodColors: Record<DogBehaviorLog["mood"], string> = {
  anxious: "bg-red-100 text-red-700 border-red-200",
  excited: "bg-orange-100 text-orange-700 border-orange-200",
  calm: "bg-green-100 text-green-700 border-green-200",
  distracted: "bg-yellow-100 text-yellow-700 border-yellow-200",
  focused: "bg-blue-100 text-blue-700 border-blue-200",
  reactive: "bg-purple-100 text-purple-700 border-purple-200",
};

const moodEmoji: Record<DogBehaviorLog["mood"], string> = {
  anxious: "😰",
  excited: "🎉",
  calm: "😌",
  distracted: "🤔",
  focused: "🎯",
  reactive: "⚠️",
};

export function BehaviorJournal({ logs, dogId }: BehaviorJournalProps) {
  const [showTrends, setShowTrends] = useState(false);

  // Analyze trends
  const trends = useMemo(() => {
    if (logs.length < 3) return null;

    const moodCounts = new Map<DogBehaviorLog["mood"], number>();
    const environmentCounts = new Map<string, number>();
    const weatherCounts = new Map<string, number>();

    logs.forEach((log) => {
      moodCounts.set(log.mood, (moodCounts.get(log.mood) ?? 0) + 1);
      if (log.environment) {
        environmentCounts.set(log.environment, (environmentCounts.get(log.environment) ?? 0) + 1);
      }
      if (log.weather) {
        weatherCounts.set(log.weather, (weatherCounts.get(log.weather) ?? 0) + 1);
      }
    });

    const mostCommonMood = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostCommonEnv = Array.from(environmentCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostCommonWeather = Array.from(weatherCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

    // Check for patterns
    const anxiousInWeather = logs.filter(
      (log) => log.mood === "anxious" && log.weather
    ).length;
    const totalWithWeather = logs.filter((log) => log.weather).length;
    const anxiousWeatherRatio = totalWithWeather > 0 ? anxiousInWeather / totalWithWeather : 0;

    return {
      mostCommonMood,
      mostCommonEnv,
      mostCommonWeather,
      anxiousWeatherRatio,
      totalLogs: logs.length,
    };
  }, [logs]);

  return (
    <Card
      title="Behavior Journal"
      actions={[
        {
          key: "add-log",
          node: <AddBehaviorLogButton dogId={dogId} />,
        },
      ]}
    >
      <div className="space-y-6">
        {/* Trends Toggle */}
        {logs.length >= 3 && (
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-brand-secondary">Behavioral Insights</p>
            <button
              onClick={() => setShowTrends(!showTrends)}
              className="text-xs text-brand-primary hover:underline"
            >
              {showTrends ? "Hide Trends" : "Show Trends"}
            </button>
          </div>
        )}

        {/* Trends Display */}
        {showTrends && trends && (
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-brand-secondary">📊 Insights</h4>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Most common mood:</span>{" "}
                {moodEmoji[trends.mostCommonMood ?? "calm"]} {trends.mostCommonMood ?? "N/A"}
              </p>
              {trends.mostCommonEnv && (
                <p>
                  <span className="font-medium">Most common environment:</span> {trends.mostCommonEnv}
                </p>
              )}
              {trends.mostCommonWeather && (
                <p>
                  <span className="font-medium">Most common weather:</span> {trends.mostCommonWeather}
                </p>
              )}
              {trends.anxiousWeatherRatio > 0.3 && (
                <p className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs">
                  ⚠️ <strong>Pattern detected:</strong> Higher anxiety observed in certain weather
                  conditions. Consider adjusting training approach during these conditions.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Behavior Logs */}
        {logs.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No behavior logs yet. Start logging to track patterns and insights.
          </p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`rounded-xl border-2 p-4 ${moodColors[log.mood]}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{moodEmoji[log.mood]}</span>
                      <Badge variant="muted">{log.mood}</Badge>
                      <span className="text-xs opacity-75">
                        {format(parseISO(log.createdAt), "MMM d, HH:mm")}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {log.environment && (
                        <p>
                          <span className="font-medium">Environment:</span> {log.environment}
                        </p>
                      )}
                      {log.weather && (
                        <p>
                          <span className="font-medium">Weather:</span> {log.weather}
                        </p>
                      )}
                      {log.distractions && (
                        <p>
                          <span className="font-medium">Distractions:</span> {log.distractions}
                        </p>
                      )}
                      <p className="mt-2">{log.notes}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <EditBehaviorLogButton log={log} dogId={dogId} />
                    <DeleteBehaviorLogButton logId={log.id} />
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


