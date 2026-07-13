import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStaffList, handleSignOut } from "@/lib/actions";
import { StaffTable } from "@/components/staff-table";
import { AddStaffDialog } from "@/components/add-staff-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import { Sidebar } from "@/components/sidebar";

export default async function StaffPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const staff = await getStaffList();

  return (
    <div className="flex min-h-screen bg-[var(--crm-bg)]">
      <Sidebar user={{ name: session.user.name || "", role: session.user.role || "" }} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-[var(--crm-border)] bg-[var(--crm-surface)] px-6 py-4 flex items-center md:min-h-[73px]">
          <h1 className="text-xl font-bold ml-12 md:ml-0 text-[var(--crm-text-primary)]">Staff Management</h1>
        </header>

      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Staff Members</h2>
            <p className="text-muted-foreground">Manage team access and roles</p>
          </div>
          <AddStaffDialog />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Staff</CardTitle>
            <CardDescription>{staff.length} member{staff.length !== 1 ? "s" : ""} in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <StaffTable staff={staff} currentUserId={session.user.id} />
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  );
}
