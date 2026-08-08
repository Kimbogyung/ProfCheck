import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { verifyPassword, createSession, setSessionCookie } from "@/lib/auth";

const loginSchema = z.object({
  studentId: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  const { studentId, password } = parsed.data;

  const { data: user, error } = await supabase
    .from("users")
    .select("id, student_id, password_hash, role, password_changed")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSession({
    userId: user.id,
    studentId: user.student_id,
    role: user.role,
    passwordChanged: user.password_changed,
  });
  await setSessionCookie(token);

  return NextResponse.json({ mustChangePassword: !user.password_changed });
}
