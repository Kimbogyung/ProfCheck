import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionFromCookies } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, student_id, role, password_changed, created_at")
    .order("student_id", { ascending: true });

  if (error) {
    return NextResponse.json({ message: "조회에 실패했습니다" }, { status: 500 });
  }

  return NextResponse.json(
    data.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      role: row.role,
      passwordChanged: row.password_changed,
      createdAt: row.created_at,
    })),
  );
}

export async function POST() {
  return NextResponse.json({ message: "Not implemented" }, { status: 501 });
}
