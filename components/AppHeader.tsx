"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  nickname?: string | null;
  showAdminLink?: boolean;
};

export default function AppHeader({ nickname, showAdminLink }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between bg-primary px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="text-[22px] font-extrabold tracking-tight text-white">
          UbSE
        </span>
        <span className="h-4 w-px bg-white/40" aria-hidden="true" />
        <span className="text-[18px] font-semibold text-white">
          ProfCheck
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        {showAdminLink && (
          <Link
            href="/admin"
            className="rounded-md border border-white/50 px-4 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
          >
            관리자
          </Link>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md border border-white/50 px-4 py-1.5 font-medium text-white transition-colors hover:bg-white/10"
        >
          로그아웃
        </button>
        {nickname && (
          <span className="rounded-full bg-white/20 px-4 py-1.5 font-medium text-white">
            {nickname}님
          </span>
        )}
      </div>
    </header>
  );
}
