import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import WeeklyCalendar from "@/components/WeeklyCalendar";

export default async function HomePage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="flex flex-1 flex-col">
      <WeeklyCalendar
        currentUserId={session.userId}
        nickname={session.nickname ?? ""}
        isAdmin={session.role === "ADMIN"}
      />
    </main>
  );
}
