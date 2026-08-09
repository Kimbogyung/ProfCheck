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
    const res = await fetch(`/api/daily-status/${date}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      await refetch();
    }
  }

  async function handleCreateTimeOff(
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<string | null> {
    const res = await fetch("/api/time-off", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, endTime }),
    });
    if (res.ok) {
      await refetch();
      return null;
    }
    const data = await res.json().catch(() => null);
    return data?.message ?? "등록에 실패했습니다";
  }

  async function handleDeleteTimeOff(id: string) {
    const res = await fetch(`/api/time-off/${id}`, { method: "DELETE" });
    if (res.ok) {
      await refetch();
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <AppHeader nickname={nickname} showAdminLink={isAdmin} />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <p className="text-lg font-bold text-text">{nickname}님, 안녕하세요</p>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
              {isAdmin ? "ADMIN" : "MEMBER"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="이전 주"
              onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-soft transition-colors hover:bg-primary-light"
            >
              ‹
            </button>
            <button
              type="button"
              title="이번 주로 돌아가기"
              onClick={() => setWeekStart(getCurrentWeekStart())}
              className="rounded-lg bg-primary-light px-4 py-1.5 text-sm font-medium text-text transition-colors hover:bg-primary/15"
            >
              {formatWeekRangeLabel(weekDates)}
            </button>
            <button
              type="button"
              aria-label="다음 주"
              onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-soft transition-colors hover:bg-primary-light"
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

          <div className="my-4 border-t border-border" />

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
