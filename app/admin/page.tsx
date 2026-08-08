"use client";

import { useCallback, useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";

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
    <div className="flex flex-1 flex-col bg-background">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10">
        <h1 className="text-2xl font-bold text-text">사용자 관리</h1>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-text-soft">{message}</p>}

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-soft">
                <th className="py-2 pr-2 font-medium">학번</th>
                <th className="py-2 pr-2 font-medium">권한</th>
                <th className="py-2 pr-2 font-medium">비번 변경 여부</th>
                <th className="py-2 pr-2 font-medium">가입일</th>
                <th className="py-2 pr-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border text-text">
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
                      className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-text-soft transition-colors hover:bg-primary-light disabled:opacity-50"
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
          <p className="text-sm text-text-soft">불러오는 중...</p>
        )}
      </main>
    </div>
  );
}
