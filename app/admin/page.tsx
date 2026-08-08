"use client";

import { useCallback, useEffect, useState } from "react";

type AdminUser = {
  id: string;
  studentId: string;
  role: "MEMBER" | "ADMIN";
  passwordChanged: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        throw new Error("failed to load users");
      }
      setUsers(await res.json());
    } catch {
      setError("사용자 목록을 불러오지 못했습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  async function handleResetPassword(user: AdminUser) {
    if (
      !window.confirm(`${user.studentId} 계정의 비밀번호를 1234로 초기화할까요?`)
    ) {
      return;
    }

    setResettingId(user.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("reset failed");
      }
      setMessage(`${user.studentId} 계정이 1234로 초기화됐습니다`);
      await refetch();
    } catch {
      setMessage(`${user.studentId} 계정 초기화에 실패했습니다`);
    } finally {
      setResettingId(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">사용자 관리</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && (
        <p className="text-sm text-black/70 dark:text-white/70">{message}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="py-2 pr-2 font-medium">학번</th>
              <th className="py-2 pr-2 font-medium">권한</th>
              <th className="py-2 pr-2 font-medium">비번 변경 여부</th>
              <th className="py-2 pr-2 font-medium">가입일</th>
              <th className="py-2 pr-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-black/5 dark:border-white/5"
              >
                <td className="py-2 pr-2">{user.studentId}</td>
                <td className="py-2 pr-2">{user.role}</td>
                <td className="py-2 pr-2">
                  {user.passwordChanged ? "변경함" : "변경 안 함"}
                </td>
                <td className="py-2 pr-2">{user.createdAt.slice(0, 10)}</td>
                <td className="py-2 pr-2">
                  <button
                    type="button"
                    disabled={resettingId === user.id}
                    onClick={() => handleResetPassword(user)}
                    className="rounded-md border border-black/15 px-2 py-1 text-xs disabled:opacity-50 dark:border-white/15"
                  >
                    비밀번호 초기화
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLoading && (
        <p className="text-sm text-black/50 dark:text-white/50">
          불러오는 중...
        </p>
      )}
    </main>
  );
}
