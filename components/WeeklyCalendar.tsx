"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DayToggleBar from "./DayToggleBar";
import TimeGrid from "./TimeGrid";
import { getCurrentWeekStart, getWeekDates, shiftWeek } from "@/lib/week";
import type { DailyStatusEntry, TimeOffEntry } from "@/lib/types";

type Props = {
  currentUserId: string;
};

export default function WeeklyCalendar({ currentUserId }: Props) {
  const router = useRouter();
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
    // weekStart가 바뀔 때마다 서버 데이터를 다시 가져온다 (외부 API 동기화이지 렌더 중 setState가 아님).
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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">교수님 주간 일정</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-black/60 underline underline-offset-2 dark:text-white/60"
        >
          로그아웃
        </button>
      </header>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/15"
        >
          이전 주
        </button>
        <button
          type="button"
          onClick={() => setWeekStart(getCurrentWeekStart())}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/15"
        >
          이번 주로 돌아가기
        </button>
        <button
          type="button"
          onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm dark:border-white/15"
        >
          다음 주
        </button>
      </div>

      <p className="text-center text-sm text-black/60 dark:text-white/60">
        {weekDates[0]} ~ {weekDates[6]}
      </p>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

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
        onCreateTimeOff={handleCreateTimeOff}
        onDeleteTimeOff={handleDeleteTimeOff}
        isLoading={isLoading}
      />
    </div>
  );
}
