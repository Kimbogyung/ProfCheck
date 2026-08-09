import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  return <AdminDashboard nickname={session.nickname ?? ""} />;
}
