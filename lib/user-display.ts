import { supabase } from "@/lib/supabase";

export const UNKNOWN_USER_LABEL = "알 수 없음";

// user id -> 화면에 보여줄 이름(닉네임, 없으면 학번)의 맵을 만든다.
export async function getDisplayNameMap(
  userIds: (string | null | undefined)[],
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(
    new Set(userIds.filter((id): id is string => Boolean(id))),
  );
  const map = new Map<string, string>();
  if (uniqueIds.length === 0) return map;

  const { data } = await supabase
    .from("users")
    .select("id, student_id, nickname")
    .in("id", uniqueIds);

  for (const user of data ?? []) {
    map.set(user.id, user.nickname ?? user.student_id);
  }
  return map;
}

// userId가 없으면(레코드 자체가 없음) null, 있는데 매핑이 안 되면(삭제된 사용자 등)
// UNKNOWN_USER_LABEL로 안전하게 대체한다.
export function resolveDisplayName(
  map: Map<string, string>,
  userId: string | null | undefined,
): string | null {
  if (!userId) return null;
  return map.get(userId) ?? UNKNOWN_USER_LABEL;
}
