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
    <div className="grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5">
      <span className="text-xs font-medium text-text-soft">전체 부재</span>
      {weekDates.map((date) => {
        const status = statusByDate.get(date) ?? "ON";
        const isOff = status === "OFF";
        return (
          <button
            key={date}
            type="button"
            disabled={isLoading}
            onClick={() => onToggle(date, isOff ? "ON" : "OFF")}
            className="flex flex-col items-center gap-1.5 rounded-lg py-1.5 transition-opacity disabled:opacity-50"
          >
            <span className="text-xs font-medium text-text">
              {getWeekdayLabel(date)}
            </span>
            <span className="text-[10px] text-text-soft">
              {date.slice(5).replace("-", "/")}
            </span>
            <span
              className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors ${
                isOff ? "justify-end bg-primary" : "justify-start bg-primary-light"
              }`}
            >
              <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
