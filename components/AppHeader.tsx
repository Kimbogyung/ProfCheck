"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  showAdminLink?: boolean;
};

export default function AppHeader({ showAdminLink }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        <span className="font-serif text-lg font-semibold text-text">
          ProfCheck
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {showAdminLink && (
          <Link
            href="/admin"
            className="rounded-full bg-primary-light px-4 py-1.5 font-medium text-primary-hover transition-colors hover:bg-primary/20"
          >
            관리자
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-border px-4 py-1.5 font-medium text-text-soft transition-colors hover:bg-primary-light"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
