"use client";

import type { DailyStatusEntry } from "@/lib/types";
import { getWeekdayLabel } from "@/lib/week";
import AttributionTooltip from "@/components/AttributionTooltip";

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
  const entryByDate = new Map(
    dailyStatus.map((entry) => [entry.date, entry]),
  );

  return (
    // TimeGrid와 같은 grid-cols-[64px_repeat(7,1fr)] 템플릿을 쓰므로, 좁은 화면에서
    // 컬럼 폭이 TimeGrid와 어긋나지 않도록 동일한 overflow-x-auto/min-w 패턴을 쓴다.
    <div className="overflow-x-auto">
      <div className="grid min-w-[560px] grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5">
        <span className="text-xs font-medium text-text-soft">전체 부재</span>
        {weekDates.map((date) => {
          const entry = entryByDate.get(date);
          const isOff = entry?.status === "OFF";
          const tooltipLabel =
            isOff && entry?.updatedByNickname
              ? `${entry.updatedByNickname}님이 등록`
              : null;

          return (
            <AttributionTooltip key={date} label={tooltipLabel} className="w-full">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => onToggle(date, isOff ? "ON" : "OFF")}
                className="flex w-full flex-col items-center gap-1.5 rounded-lg py-1.5 transition-opacity disabled:opacity-50"
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
            </AttributionTooltip>
          );
        })}
      </div>
    </div>
  );
}
