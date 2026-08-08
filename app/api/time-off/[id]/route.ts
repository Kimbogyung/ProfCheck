import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { getSessionFromCookies } from "@/lib/auth";
import { BUSINESS_START, BUSINESS_END, combineDateAndTime, formatTimeOfDay } from "@/lib/time-off";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const updateSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  const { startTime, endTime } = parsed.data;

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

  const { data: existing, error: fetchError } = await supabase
    .from("time_off")
    .select("id, date, created_by")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (existing.created_by !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("time_off")
    .update({
      start_time: combineDateAndTime(existing.date, startTime),
      end_time: combineDateAndTime(existing.date, endTime),
      updated_by: session.userId,
    })
    .eq("id", id)
    .select("id, date, start_time, end_time, created_by, updated_by")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ message: "수정에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({
    id: updated.id,
    date: updated.date,
    startTime: formatTimeOfDay(updated.start_time),
    endTime: formatTimeOfDay(updated.end_time),
    createdBy: updated.created_by,
    updatedBy: updated.updated_by,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: existing, error: fetchError } = await supabase
    .from("time_off")
    .select("id, created_by")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (existing.created_by !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await supabase
    .from("time_off")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ message: "삭제에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
