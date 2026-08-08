import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getSessionFromCookies } from "@/lib/auth";
import { getWeekDates } from "@/lib/week";
import {
  BUSINESS_START,
  BUSINESS_END,
  combineDateAndTime,
  formatTimeOfDay,
} from "@/lib/time-off";

const weekQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = weekQuerySchema.safeParse({
    weekStart: request.nextUrl.searchParams.get("weekStart"),
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const dates = getWeekDates(parsed.data.weekStart);

  const { data, error } = await supabase
    .from("time_off")
    .select("id, date, start_time, end_time, created_by, updated_by")
    .gte("date", dates[0])
    .lte("date", dates[6])
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ message: "조회에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json(
    data.map((row) => ({
      id: row.id,
      date: row.date,
      startTime: formatTimeOfDay(row.start_time),
      endTime: formatTimeOfDay(row.end_time),
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    })),
  );
}

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: timeSchema,
  endTime: timeSchema,
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  const { date, startTime, endTime } = parsed.data;

  if (startTime >= endTime) {
    return NextResponse.json(
      { message: "시작 시간은 종료 시간보다 빨라야 합니다" },
      { status: 400 },
    );
  }
  if (startTime < BUSINESS_START || endTime > BUSINESS_END) {
    return NextResponse.json(
      {
        message: `${BUSINESS_START}~${BUSINESS_END} 범위 내에서만 등록할 수 있습니다`,
      },
      { status: 400 },
    );
  }

  const { data: dailyStatus, error: dailyStatusError } = await supabase
    .from("daily_status")
    .select("status")
    .eq("date", date)
    .maybeSingle();

  if (dailyStatusError) {
    return NextResponse.json({ message: "조회에 실패했습니다" }, { status: 500 });
  }
  if (dailyStatus?.status === "OFF") {
    return NextResponse.json(
      { message: "종일 부재 상태에서는 특정 시간 부재를 등록할 수 없습니다" },
      { status: 400 },
    );
  }

  const { data: created, error: insertError } = await supabase
    .from("time_off")
    .insert({
      date,
      start_time: combineDateAndTime(date, startTime),
      end_time: combineDateAndTime(date, endTime),
      created_by: session.userId,
    })
    .select("id, date, start_time, end_time, created_by")
    .single();

  if (insertError || !created) {
    return NextResponse.json({ message: "등록에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: created.id,
      date: created.date,
      startTime: formatTimeOfDay(created.start_time),
      endTime: formatTimeOfDay(created.end_time),
      createdBy: created.created_by,
    },
    { status: 201 },
  );
}
