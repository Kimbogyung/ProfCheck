import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getSessionFromCookies } from "@/lib/auth";
import { getWeekDates } from "@/lib/week";

const querySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    weekStart: request.nextUrl.searchParams.get("weekStart"),
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const dates = getWeekDates(parsed.data.weekStart);

  const { data, error } = await supabase
    .from("daily_status")
    .select("date, status, updated_by, updated_at")
    .gte("date", dates[0])
    .lte("date", dates[6]);

  if (error) {
    return NextResponse.json({ message: "조회에 실패했습니다" }, { status: 500 });
  }

  const byDate = new Map(data.map((row) => [row.date, row]));

  const result = dates.map((date) => {
    const row = byDate.get(date);
    return {
      date,
      status: row?.status ?? "ON",
      updatedBy: row?.updated_by ?? null,
      updatedAt: row?.updated_at ?? null,
    };
  });

  return NextResponse.json(result);
}
