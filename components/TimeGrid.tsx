"use client";

import { useState } from "react";
import type { DailyStatusEntry, TimeOffEntry } from "@/lib/types";

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
}: Props) {
  const [pending, setPending] = useState<PendingSelection | null>(null);

  const statusByDate = new Map(
    dailyStatus.map((entry) => [entry.date, entry.status]),
  );

  const timeOffByDate = new Map<string, TimeOffEntry[]>();
  for (const record of timeOff) {
    const list = timeOffByDate.get(record.date) ?? [];
    list.push(record);
    timeOffByDate.set(record.date, list);
  }

  async function handleCellClick(date: string, hour: number) {
    if (isLoading) return;
    if (statusByDate.get(date) === "OFF") return;

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
      setPending({ date, startHour: hour });
      return;
    }

    const startHour = Math.min(pending.startHour, hour);
    const endHour = Math.max(pending.startHour, hour) + 1;
    setPending(null);

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
    <div className="flex flex-col gap-2">
      <p className="h-4 text-center text-xs text-text-soft">
        {pending
          ? "종료 시간을 클릭하면 부재로 등록됩니다. 다른 날짜를 클릭하면 취소됩니다."
          : ""}
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5 py-[3px]"
            >
              <div className="flex items-center justify-end pr-2 text-xs text-text-soft">
                {pad2(hour)}:00
              </div>
              {weekDates.map((date) => {
                const isOff = statusByDate.get(date) === "OFF";
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

                return (
                  <button
                    key={date}
                    type="button"
                    disabled={isLoading || isBlocked}
                    onClick={() => handleCellClick(date, hour)}
                    aria-label={`${date} ${pad2(hour)}:00`}
                    className={`h-7 rounded-lg border transition-colors ${
                      isAbsent
                        ? "border-transparent bg-absence"
                        : "border-border bg-surface"
                    } ${
                      isPendingStart
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : ""
                    } ${
                      isBlocked
                        ? "cursor-not-allowed"
                        : "cursor-pointer hover:border-primary/50"
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
