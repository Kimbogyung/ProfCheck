"use client";

import { useState } from "react";
import type { DailyStatusEntry, TimeOffEntry } from "@/lib/types";
import AttributionTooltip from "@/components/AttributionTooltip";

// 09:00~21:00을 1시간 단위 12개 블록으로 표현한다.
const HOURS = Array.from({ length: 12 }, (_, i) => i + 9);

type Props = {
  weekDates: string[];
  dailyStatus: DailyStatusEntry[];
  timeOff: TimeOffEntry[];
  currentUserId: string;
  isAdmin?: boolean;
  onCreateTimeOff: (
    date: string,
    startTime: string,
    endTime: string,
  ) => Promise<string | null>;
  onDeleteTimeOff: (id: string) => void | Promise<void>;
  isLoading?: boolean;
  // 대기 중인 선택(시작 시간 클릭 후 종료 시간 대기)이 생기고 사라질 때마다 알려준다.
  // 안내 문구는 가로 스크롤 컨테이너 밖(WeeklyCalendar)에서 렌더링하기 때문에,
  // pending 상태 자체는 이 컴포넌트 안에 그대로 두고 boolean만 위로 흘려보낸다.
  onPendingChange?: (isPending: boolean) => void;
};

type PendingSelection = { date: string; startHour: number };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function hourBlockRange(hour: number): [string, string] {
  return [`${pad2(hour)}:00`, `${pad2(hour + 1)}:00`];
}

function findOverlappingRecord(
  records: TimeOffEntry[],
  hour: number,
): TimeOffEntry | undefined {
  const [blockStart, blockEnd] = hourBlockRange(hour);
  return records.find((r) => r.startTime < blockEnd && r.endTime > blockStart);
}

export default function TimeGrid({
  weekDates,
  dailyStatus,
  timeOff,
  currentUserId,
  isAdmin,
  onCreateTimeOff,
  onDeleteTimeOff,
  isLoading,
  onPendingChange,
}: Props) {
  const [pending, setPending] = useState<PendingSelection | null>(null);

  function updatePending(next: PendingSelection | null) {
    setPending(next);
    onPendingChange?.(next !== null);
  }

  const dailyStatusByDate = new Map(
    dailyStatus.map((entry) => [entry.date, entry]),
  );

  const timeOffByDate = new Map<string, TimeOffEntry[]>();
  for (const record of timeOff) {
    const list = timeOffByDate.get(record.date) ?? [];
    list.push(record);
    timeOffByDate.set(record.date, list);
  }

  async function handleCellClick(date: string, hour: number) {
    if (isLoading) return;
    if (dailyStatusByDate.get(date)?.status === "OFF") return;

    const records = timeOffByDate.get(date) ?? [];
    const occupied = findOverlappingRecord(records, hour);

    if (occupied) {
      if (occupied.createdBy === currentUserId || isAdmin) {
        if (window.confirm("이 시간 부재를 삭제할까요?")) {
          await onDeleteTimeOff(occupied.id);
        }
      }
      return;
    }

    if (!pending || pending.date !== date) {
      updatePending({ date, startHour: hour });
      return;
    }

    const startHour = Math.min(pending.startHour, hour);
    const endHour = Math.max(pending.startHour, hour) + 1;
    updatePending(null);

    const errorMessage = await onCreateTimeOff(
      date,
      `${pad2(startHour)}:00`,
      `${pad2(endHour)}:00`,
    );
    if (errorMessage) {
      window.alert(errorMessage);
    }
  }

  return (
    <div className="pt-3">
      {HOURS.map((hour) => (
        <div
          key={hour}
          className="relative grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5 border-t border-border py-[3px]"
        >
          <span className="pointer-events-none absolute left-0 top-0 z-10 w-16 -translate-y-1/2 truncate bg-surface pr-2 text-right text-xs text-text-soft">
            {pad2(hour)}:00
          </span>
          <div />
          {weekDates.map((date) => {
            const dailyEntry = dailyStatusByDate.get(date);
            const isOff = dailyEntry?.status === "OFF";
            const records = timeOffByDate.get(date) ?? [];
            const occupied = !isOff
              ? findOverlappingRecord(records, hour)
              : undefined;
            const canManage =
              occupied?.createdBy === currentUserId || isAdmin;
            const isPendingStart =
              pending?.date === date && pending.startHour === hour;
            const isBlocked = isOff || (Boolean(occupied) && !canManage);
            const isAbsent = isOff || Boolean(occupied);
            // 이 셀이 빨갛게 칠해진 이유(종일 OFF가 우선, 아니면 특정 시간 부재)에
            // 맞는 등록자 닉네임을 라벨로 쓴다.
            const attributionNickname = isOff
              ? dailyEntry?.updatedByNickname
              : occupied?.createdByNickname;
            const tooltipLabel = attributionNickname
              ? `${attributionNickname}님이 등록`
              : null;
            // 맨 위 2개 행(09:00, 10:00)은 위쪽에 띄우면 화면 밖으로 잘리므로 아래쪽에 표시한다.
            const tooltipPlacement =
              hour < HOURS[0] + 2 ? "bottom" : "top";

            return (
              <AttributionTooltip
                key={date}
                label={tooltipLabel}
                placement={tooltipPlacement}
                className="w-full"
              >
                <button
                  type="button"
                  // "편집 불가" 셀(종일 OFF, 타인 소유 등)도 handleCellClick 내부
                  // 가드가 이미 안전하게 아무 동작도 하지 않으므로, native disabled는
                  // 로딩 중일 때만 걸어서 hover/모바일 탭으로 항상 툴팁을 볼 수 있게
                  // 한다. isBlocked는 시각적 스타일(cursor-not-allowed)에만 쓴다.
                  disabled={isLoading}
                  onClick={() => handleCellClick(date, hour)}
                  aria-label={`${date} ${pad2(hour)}:00`}
                  className={`h-7 w-full rounded-lg border border-t-transparent border-r-transparent border-b-transparent border-l-border transition-colors ${
                    isAbsent ? "bg-absence" : "bg-surface"
                  } ${
                    isPendingStart
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-canvas"
                      : ""
                  } ${
                    isBlocked
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:border-primary/50"
                  }`}
                />
              </AttributionTooltip>
            );
          })}
        </div>
      ))}
    </div>
  );
}
