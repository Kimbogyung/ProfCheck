import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getSessionFromCookies } from "@/lib/auth";

const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const bodySchema = z.object({
  status: z.enum(["ON", "OFF"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { date } = await params;
  if (!dateParamSchema.safeParse(date).success) {
    return NextResponse.json({ message: "Invalid date" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  const { status } = parsed.data;

  const { error: upsertError } = await supabase
    .from("daily_status")
    .upsert(
      { date, status, updated_by: session.userId },
      { onConflict: "date" },
    );

  if (upsertError) {
    return NextResponse.json(
      { message: "상태 변경에 실패했습니다" },
      { status: 500 },
    );
  }

  // OFF 전환 시 해당 날짜의 시간 부재는 종일 부재로 통합되므로 전부 삭제한다 (10.1)
  if (status === "OFF") {
    const { error: deleteError } = await supabase
      .from("time_off")
      .delete()
      .eq("date", date);

    if (deleteError) {
      return NextResponse.json(
        { message: "시간 부재 정리에 실패했습니다" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ date, status });
}
