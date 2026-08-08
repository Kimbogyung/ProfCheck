import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

// 계정을 발급할 학번 목록 (placeholder — 실제 명단으로 교체해서 실행)
const studentIds = ["20231234", "20231235", "20231236", "20231237"];

const INITIAL_PASSWORD = "1234";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되어 있지 않습니다",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function main() {
  const passwordHash = await bcrypt.hash(INITIAL_PASSWORD, 10);

  // 이미 존재하는 학번은 건너뛴다 (재실행해도 기존 계정의 비밀번호를 덮어쓰지 않음)
  const { data, error } = await supabase
    .from("users")
    .upsert(
      studentIds.map((studentId) => ({
        student_id: studentId,
        password_hash: passwordHash,
        role: "MEMBER",
        password_changed: false,
      })),
      { onConflict: "student_id", ignoreDuplicates: true },
    )
    .select("student_id");

  if (error) {
    console.error("계정 생성 실패:", error.message);
    process.exit(1);
  }

  const createdIds = new Set((data ?? []).map((row) => row.student_id));
  for (const studentId of studentIds) {
    console.log(
      createdIds.has(studentId)
        ? `[${studentId}] 계정 생성 완료 (초기 비밀번호: ${INITIAL_PASSWORD})`
        : `[${studentId}] 이미 존재하는 계정 — 건너뜀`,
    );
  }
}

main();
