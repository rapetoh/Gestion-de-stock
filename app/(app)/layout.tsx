import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "@/components/AppShell";

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
    <AppShell nom={session.nom} role={session.role}>
      {children}
    </AppShell>
  );
}
