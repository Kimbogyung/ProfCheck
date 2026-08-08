import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

// 계정을 발급할 학번 목록은 scripts/students.json에서 읽는다.
// 이 파일은 .gitignore에 등록되어 git에 커밋되지 않으므로,
// 실제 배포 전 scripts/students.json을 직접 만들어서 실제 학번 배열
// (예: ["20230001", "20230002"])로 채워야 한다.
const studentsFilePath = path.resolve(process.cwd(), "scripts/students.json");

let studentIds: string[];
try {
  studentIds = JSON.parse(readFileSync(studentsFilePath, "utf-8"));
} catch {
  throw new Error(
    `${studentsFilePath} 파일을 읽을 수 없습니다. ["학번1", "학번2", ...] 형태의 JSON 배열로 파일을 먼저 만들어주세요.`,
  );
}

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
