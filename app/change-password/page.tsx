"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword === "1234") {
      setError("초기 비밀번호는 새 비밀번호로 사용할 수 없습니다");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "비밀번호 변경에 실패했습니다");
        return;
      }

      router.push("/");
    } catch {
      setError("비밀번호 변경 중 문제가 발생했습니다. 다시 시도해주세요");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-surface p-8 shadow-sm"
      >
        <div className="text-center">
          <span className="font-serif text-2xl font-semibold text-text">
            ProfCheck
          </span>
          <p className="mt-1 text-sm text-text-soft">비밀번호 변경</p>
        </div>
        <p className="text-sm text-text-soft">
          최초 로그인 시에는 비밀번호를 반드시 변경해야 합니다.
        </p>

        <div className="space-y-1.5">
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-text"
          >
            현재 비밀번호
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-text"
          >
            새 비밀번호
          </label>
          <input
            id="newPassword"
            type="password"
            required
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-text"
          >
            새 비밀번호 확인
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </main>
  );
}
