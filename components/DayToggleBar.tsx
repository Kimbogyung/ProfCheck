"use client";

import type { DailyStatusEntry } from "@/lib/types";
import { getWeekdayLabel } from "@/lib/week";

type Props = {
  weekDates: string[];
  dailyStatus: DailyStatusEntry[];
  onToggle: (date: string, nextStatus: "ON" | "OFF") => void;
  isLoading?: boolean;
};

export default function DayToggleBar({
  weekDates,
  dailyStatus,
  onToggle,
  isLoading,
}: Props) {
  const statusByDate = new Map(
    dailyStatus.map((entry) => [entry.date, entry.status]),
  );

  return (
    <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-1 text-center text-sm">
      <div className="flex items-center justify-center text-xs font-medium text-black/60 dark:text-white/60">
        전체
      </div>
      {weekDates.map((date) => {
        const status = statusByDate.get(date) ?? "ON";
        const isOff = status === "OFF";
        return (
          <button
            key={date}
            type="button"
            disabled={isLoading}
            onClick={() => onToggle(date, isOff ? "ON" : "OFF")}
            className={`rounded-md border px-1 py-1.5 font-medium transition-colors disabled:opacity-50 ${
              isOff
                ? "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
                : "border-black/15 bg-white text-black/70 dark:border-white/15 dark:bg-transparent dark:text-white/70"
            }`}
          >
            <div>{getWeekdayLabel(date)}</div>
            <div className="text-[11px] opacity-70">
              {date.slice(5).replace("-", "/")}
            </div>
            <div className="mt-0.5 text-[10px]">{status}</div>
          </button>
        );
      })}
    </div>
  );
}
