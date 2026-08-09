"use client";

import { useCallback, useEffect, useState } from "react";
import AppHeader from "./AppHeader";
import DayToggleBar from "./DayToggleBar";
import TimeGrid from "./TimeGrid";
import {
  formatWeekRangeLabel,
  getCurrentWeekStart,
  getWeekDates,
  shiftWeek,
} from "@/lib/week";
import type { DailyStatusEntry, TimeOffEntry } from "@/lib/types";

type Props = {
  currentUserId: string;
  nickname: string;
  isAdmin?: boolean;
};

export default function WeeklyCalendar({
  currentUserId,
  nickname,
  isAdmin,
}: Props) {
  const [weekStart, setWeekStart] = useState(() => getCurrentWeekStart());
  const [dailyStatus, setDailyStatus] = useState<DailyStatusEntry[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekDates = getWeekDates(weekStart);
  const isCurrentWeek = weekStart === getCurrentWeekStart();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dailyRes, timeOffRes] = await Promise.all([
        fetch(`/api/daily-status?weekStart=${weekStart}`),
        fetch(`/api/time-off?weekStart=${weekStart}`),
      ]);
      if (!dailyRes.ok || !timeOffRes.ok) {
        throw new Error("failed to load week data");
      }
      setDailyStatus(await dailyRes.json());
      setTimeOff(await timeOffRes.json());
    } catch {
      setError("일정을 불러오지 못했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    // weekStart가 바뀔 때마다 서버 데이터를 다시 가져온다 (외부 API 동기화이지 렌더 중 setState가 아니다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  async function handleToggleDay(date: string, nextStatus: "ON" | "OFF") {
    // optimistic: 응답을 기다리지 않고 즉시 반영한다. OFF 전환은 서버에서 해당
    // 날짜의 time_off를 전부 삭제하므로(10.1) 로컬에서도 동일하게 미리 비운다.
    const previousEntry = dailyStatus.find((entry) => entry.date === date);
    const removedTimeOff =
      nextStatus === "OFF" ? timeOff.filter((entry) => entry.date === date) : [];

    setDailyStatus((prev) =>
      prev.map((entry) =>
        entry.date === date
          ? {
              date,
              status: nextStatus,
              updatedBy: currentUserId,
              updatedByNickname: nickname,
              updatedAt: new Date().toISOString(),
            }
          : entry,
      ),
    );
    if (nextStatus === "OFF") {
      setTimeOff((prev) => prev.filter((entry) => entry.date !== date));
    }
    setError(null);

    const res = await fetch(`/api/daily-status/${date}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!res.ok) {
      // 롤백: 날짜 상태와 (있었다면) 지워졌던 time_off를 원래대로 되돌린다.
      if (previousEntry) {
        setDailyStatus((prev) =>
          prev.map((entry) => (entry.date === date ? previousEntry : entry)),
        );
      }
      if (removedTimeOff.length > 0) {
        setTimeOff((prev) => [...prev, ...removedTimeOff]);
      }
      setError("상태 변경에 실패했습니다");
    }
  }

  async function handleCreateTimeOff(
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<string | null> {
    // optimistic: 임시 id로 즉시 화면에 추가하고, 서버가 준 실제 id로 나중에 교체한다.
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticEntry: TimeOffEntry = {
      id: tempId,
      date,
      startTime,
      endTime,
      createdBy: currentUserId,
      createdByNickname: nickname,
      updatedBy: null,
    };

    setTimeOff((prev) => [...prev, optimisticEntry]);
    setError(null);

    const res = await fetch("/api/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, endTime }),
    });

    if (!res.ok) {
      setTimeOff((prev) => prev.filter((entry) => entry.id !== tempId));
      const data = await res.json().catch(() => null);
      return data?.message ?? "등록에 실패했습니다";
    }

    const created = await res.json();
    setTimeOff((prev) =>
      prev.map((entry) =>
        entry.id === tempId ? { ...entry, id: created.id } : entry,
      ),
    );
    return null;
  }

  async function handleDeleteTimeOff(id: string) {
    // optimistic: 즉시 화면에서 지우고, 실패하면 되돌린다.
    const deletedEntry = timeOff.find((entry) => entry.id === id);
    setTimeOff((prev) => prev.filter((entry) => entry.id !== id));
    setError(null);

    const res = await fetch(`/api/time-off/${id}`, { method: "DELETE" });
    if (!res.ok && deletedEntry) {
      setTimeOff((prev) => [...prev, deletedEntry]);
      setError("삭제에 실패했습니다");
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <AppHeader nickname={nickname} showAdminLink={isAdmin} />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center max-[480px]:p-3">
          <div>
            <p className="text-lg font-bold text-text">이번 주 교수님 일정</p>
            <p className="mt-1 text-sm text-text-soft">
              색이 칠해진 시간대만 교수님 부재 확인된 시간입니다
            </p>
          </div>

          <div className="flex items-center gap-2 max-[480px]:w-full max-[480px]:flex-wrap max-[480px]:justify-center max-[480px]:gap-1.5">
            <button
              type="button"
              aria-label="이전 주"
              onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-soft transition-colors hover:bg-primary-light max-[480px]:h-8 max-[480px]:w-8"
            >
              ‹
            </button>
            <button
              type="button"
              title="이번 주로 돌아가기"
              onClick={() => setWeekStart(getCurrentWeekStart())}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors hover:bg-primary/15 max-[480px]:px-2.5 max-[480px]:text-xs ${
                isCurrentWeek
                  ? "bg-primary-light-active text-primary-hover"
                  : "bg-primary-light text-text"
              }`}
            >
              {formatWeekRangeLabel(weekDates)}
            </button>
            <button
              type="button"
              aria-label="다음 주"
              onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-soft transition-colors hover:bg-primary-light max-[480px]:h-8 max-[480px]:w-8"
            >
              ›
            </button>
          </div>
        </div>

        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-6">
          <DayToggleBar
            weekDates={weekDates}
            dailyStatus={dailyStatus}
            onToggle={handleToggleDay}
            isLoading={isLoading}
          />

          <TimeGrid
            weekDates={weekDates}
            dailyStatus={dailyStatus}
            timeOff={timeOff}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onCreateTimeOff={handleCreateTimeOff}
            onDeleteTimeOff={handleDeleteTimeOff}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
