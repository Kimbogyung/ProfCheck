import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionFromCookies, hashPassword } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const newPasswordHash = await hashPassword("1234");

  const { data, error } = await supabase
    .from("users")
    .update({ password_hash: newPasswordHash, password_changed: false })
    .eq("id", id)
    .select("id, student_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: "초기화에 실패했습니다" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, studentId: data.student_id });
}
