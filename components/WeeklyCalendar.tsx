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
  isAdmin?: boolean;
};

export default function WeeklyCalendar({ currentUserId, isAdmin }: Props) {
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
    <div className="flex flex-1 flex-col bg-background">
      <AppHeader showAdminLink={isAdmin} />

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold text-text">
            이번 주 교수님 일정
          </h1>
          <p className="mt-1.5 text-sm text-text-soft">
            색이 칠해진 시간대만 부재로 확인된 시간입니다
          </p>
        </div>

        <div className="flex items-center justify-center gap-3">
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
            className="rounded-full bg-primary-light px-4 py-1.5 text-sm font-medium text-text transition-colors hover:bg-primary/25"
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

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-text-soft">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-border bg-surface" />
            기본(정보 없음)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-timeoff-border bg-timeoff" />
            특정 시간 부재
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-dayoff" />
            종일 부재
          </span>
        </div>
      </div>
    </div>
  );
}
