import { createClient } from "@supabase/supabase-js";

export type UserRow = {
  id: string;
  student_id: string;
  password_hash: string;
  role: "MEMBER" | "ADMIN";
  password_changed: boolean;
  nickname: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyStatusRow = {
  id: string;
  date: string;
  status: "ON" | "OFF";
  updated_by: string;
  updated_at: string;
};

export type TimeOffRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string;
};

// supabase-js는 Database 제네릭이 없으면 테이블 row 타입을 never로 추론한다.
// 지금 쓰는 테이블만 최소한으로 선언해 select/insert/update 타입 체크가 되게 한다.
type Database = {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Partial<UserRow> &
          Pick<UserRow, "student_id" | "password_hash">;
        Update: Partial<UserRow>;
        Relationships: [];
      };
      daily_status: {
        Row: DailyStatusRow;
        Insert: Partial<DailyStatusRow> &
          Pick<DailyStatusRow, "date" | "status" | "updated_by">;
        Update: Partial<DailyStatusRow>;
        Relationships: [];
      };
      time_off: {
        Row: TimeOffRow;
        Insert: Partial<TimeOffRow> &
          Pick<TimeOffRow, "date" | "start_time" | "end_time" | "created_by">;
        Update: Partial<TimeOffRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

const globalForSupabase = globalThis as unknown as {
  supabase: ReturnType<typeof createClient<Database>> | undefined;
};

export const supabase =
  globalForSupabase.supabase ??
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}
