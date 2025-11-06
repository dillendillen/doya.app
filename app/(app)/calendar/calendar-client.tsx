"use client";

import { useState, useMemo } from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isToday, addMonths, subMonths, addYears, subYears } from "date-fns";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { TaskBoardColumn } from "@/lib/data/tasks";
import type { SessionListItem } from "@/lib/data/sessions";

type Birthday = {
  id: string;
  name: string;
  date: Date;
};

type CalendarClientProps = {
  initialTasks: TaskBoardColumn[];
  initialSessions: SessionListItem[];
  birthdays?: Birthday[];
};

export function CalendarClient({ initialTasks, initialSessions, birthdays = [] }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [gmailSynced, setGmailSynced] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const allTasks = useMemo(() => initialTasks.flatMap((col) => col.items), [initialTasks]);

  const getItemsForDate = (date: Date) => {
    const dayTasks = allTasks.filter((task) => {
      if (!task.due) return false;
      return isSameDay(new Date(task.due), date);
    });

    const daySessions = initialSessions.filter((session) => {
      return isSameDay(new Date(session.datetime), date);
    });

    // Check for birthdays (match month and day, ignore year)
    const dayBirthdays = birthdays.filter((birthday) => {
      const bd = new Date(birthday.date);
      return bd.getMonth() === date.getMonth() && bd.getDate() === date.getDate();
    });

    return { tasks: dayTasks, sessions: daySessions, birthdays: dayBirthdays };
  };

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day, index) => {
    if (index === 0) {
      const dayOfWeek = day.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push(new Date(day.getTime() - (dayOfWeek - i) * 24 * 60 * 60 * 1000));
      }
    }

    currentWeek.push(day);

    if (day.getDay() === 6 || index === days.length - 1) {
      while (currentWeek.length < 7) {
        const lastDay = currentWeek[currentWeek.length - 1];
        currentWeek.push(new Date(lastDay.getTime() + 24 * 60 * 60 * 1000));
      }
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevYear = () => setCurrentDate(subYears(currentDate, 1));
  const handleNextYear = () => setCurrentDate(addYears(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleGmailSync = async () => {
    // Placeholder for Gmail sync - in production, integrate with Google Calendar API
    setGmailSynced(true);
    alert("Gmail calendar sync feature will be implemented. This requires Google Calendar API integration.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevYear}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-all hover:scale-105"
            title="Previous Year"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <ChevronLeftIcon className="h-5 w-5 -ml-2" />
          </button>
          <button
            onClick={handlePrevMonth}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-all hover:scale-105"
            title="Previous Month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold text-brand-secondary min-w-[200px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={handleNextMonth}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-all hover:scale-105"
            title="Next Month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextYear}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 transition-all hover:scale-105"
            title="Next Year"
          >
            <ChevronRightIcon className="h-5 w-5" />
            <ChevronRightIcon className="h-5 w-5 -ml-2" />
          </button>
        </div>
        <button
          onClick={handleGmailSync}
          className={`btn-secondary ${gmailSynced ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""}`}
        >
          {gmailSynced ? "✓ Gmail Synced" : "Sync Gmail Calendar"}
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px border-b-2 border-slate-200">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="bg-gradient-to-b from-slate-50 to-slate-100 p-3 text-center text-sm font-semibold text-slate-700"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  const items = getItemsForDate(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`min-h-[120px] bg-white p-2 transition hover:bg-slate-50 ${!isCurrentMonth ? "opacity-40" : ""} ${isTodayDate ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                    >
                      <div
                        className={`text-sm font-bold ${isTodayDate ? "text-blue-600" : "text-slate-700"}`}
                      >
                        {format(day, "d")}
                      </div>
                      <div className="mt-1 space-y-1">
                        {items.tasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className="rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 px-2 py-1 text-xs font-medium text-white shadow-sm"
                          >
                            {task.title}
                          </div>
                        ))}
                        {items.sessions.slice(0, 2).map((session) => (
                          <div
                            key={session.id}
                            className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 px-2 py-1 text-xs font-medium text-white shadow-sm"
                          >
                            {session.title || session.dogName}
                          </div>
                        ))}
                        {items.birthdays.slice(0, 2).map((birthday) => (
                          <div
                            key={birthday.id}
                            className="rounded-lg bg-gradient-to-r from-rose-400 to-pink-500 px-2 py-1 text-xs font-medium text-white shadow-sm"
                          >
                            🎂 {birthday.name}
                          </div>
                        ))}
                        {(items.tasks.length > 2 || items.sessions.length > 2 || items.birthdays.length > 2) && (
                          <div className="text-xs text-slate-500 font-medium">
                            +{items.tasks.length + items.sessions.length + items.birthdays.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-lg bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm" />
          <span className="font-medium">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm" />
          <span className="font-medium">Sessions</span>
        </div>
      </div>
    </div>
  );
}

