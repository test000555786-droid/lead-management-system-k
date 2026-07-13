import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import ImportLeadsClient from "@/components/leads/ImportLeadsClient";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/lib/actions";

export default async function ImportPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
            <h1 className="text-xl font-bold">Import Leads</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name} ({session.user.role})</span>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="p-6">
        <ImportLeadsClient />
      </main>
    </div>
  );
}
