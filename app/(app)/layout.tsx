import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  return (
    <div className="app">
      <Sidebar nom={session.nom} role={session.role} />
      <main className="main">{children}</main>
    </div>
  );
}
