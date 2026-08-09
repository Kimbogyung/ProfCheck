import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import {
  verifyPassword,
  hashPassword,
  createSession,
  setSessionCookie,
  getSessionFromCookies,
} from "@/lib/auth";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  nickname: z
    .string()
    .trim()
    .min(1, "닉네임을 입력해주세요")
    .max(20, "닉네임은 20자 이내로 입력해주세요"),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  const { currentPassword, newPassword, nickname } = parsed.data;

  if (newPassword === "1234") {
    return NextResponse.json(
      { message: "초기 비밀번호는 새 비밀번호로 사용할 수 없습니다" },
      { status: 400 },
    );
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isValid) {
    return NextResponse.json(
      { message: "현재 비밀번호가 일치하지 않습니다" },
      { status: 401 },
    );
  }

  const newPasswordHash = await hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("users")
    .update({
      password_hash: newPasswordHash,
      password_changed: true,
      nickname,
    })
    .eq("id", session.userId);

  if (updateError) {
    return NextResponse.json(
      { message: "저장에 실패했습니다" },
      { status: 500 },
    );
  }

  const token = await createSession({
    userId: session.userId,
    studentId: session.studentId,
    role: session.role,
    passwordChanged: true,
    nickname,
  });
  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
