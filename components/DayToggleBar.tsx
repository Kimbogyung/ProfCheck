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
    // TimeGrid와 같은 grid-cols-[64px_repeat(7,1fr)] 템플릿을 쓴다. 가로 스크롤은
    // 이 컴포넌트가 아니라 부모(WeeklyCalendar)가 TimeGrid와 공유하는 하나의
    // overflow-x-auto 컨테이너로 감싸서 처리하므로, 두 영역이 항상 같은 위치로
    // 스크롤된다(독립된 스크롤 컨테이너를 따로 두지 않는다).
    <div className="grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5">
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
              className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-t-transparent border-r-transparent border-b-transparent border-l-border py-1.5 transition-opacity disabled:opacity-50"
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
  );
}
