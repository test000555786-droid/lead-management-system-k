import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import ImportLeadsClient from "@/components/leads/ImportLeadsClient";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/lib/actions";
import { Sidebar } from "@/components/sidebar";

export default async function ImportPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-[var(--crm-bg)]">
      <Sidebar user={{ name: session.user.name || "", role: session.user.role || "" }} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-[var(--crm-border)] bg-[var(--crm-surface)] px-6 py-4 flex items-center md:min-h-[73px]">
          <h1 className="text-xl font-bold ml-12 md:ml-0 text-[var(--crm-text-primary)]">Import Leads</h1>
        </header>
      <main className="p-6">
        <ImportLeadsClient />
      </main>
      </div>
    </div>
  );
}
