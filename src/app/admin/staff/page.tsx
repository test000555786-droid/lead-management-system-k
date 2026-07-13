import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStaffList } from "@/lib/actions";
import { StaffTable } from "@/components/staff-table";
import { AddStaffDialog } from "@/components/add-staff-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StaffPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const staff = await getStaffList();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
            <h1 className="text-xl font-bold">Staff Management</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name} ({session.user.role})</span>
            <form action="/api/auth/signout" method="POST">
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
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
  );
}
