"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password }),
      });

      if (!res.ok) {
        setError("학번 또는 비밀번호가 올바르지 않습니다");
        return;
      }

      const data = await res.json();
      router.push(data.mustChangePassword ? "/change-password" : "/");
    } catch {
      setError("로그인 중 문제가 발생했습니다. 다시 시도해주세요");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-canvas px-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-extrabold tracking-tight text-primary">
          UbSE
        </span>
        <span className="h-5 w-px bg-border" />
        <span className="text-lg font-semibold text-text">ProfCheck</span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-surface p-8 shadow-sm"
      >
        <h1 className="text-center text-sm text-text-soft">로그인</h1>

        <div className="space-y-1.5">
          <label
            htmlFor="studentId"
            className="block text-sm font-medium text-text"
          >
            학번
          </label>
          <input
            id="studentId"
            type="text"
            required
            autoComplete="username"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-text"
          >
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
