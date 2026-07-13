import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getFunnelData, getFollowUpsDueToday, getStaffLeaderboard, handleSignOut } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LeadStatusBadge } from "@/components/lead-status-badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const stats = await getDashboardStats();
  const funnel = await getFunnelData();
  const followUpsDue = await getFollowUpsDueToday();
  const leaderboard = isAdmin ? await getStaffLeaderboard() : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Lead Management CRM</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name} ({session.user.role})</span>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your leads and activity</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newThisWeek}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">{stats.convertedLeads} converted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Follow-ups Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.followUpsDue}</div>
              <p className="text-xs text-muted-foreground">Due today</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Funnel</CardTitle>
              <CardDescription>Lead distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {funnel.map((stage) => (
                  <div key={stage.status} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium">{stage.name}</div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${stats.totalLeads > 0 ? (stage.count / stats.totalLeads) * 100 : 0}%`, minWidth: stage.count > 0 ? "4px" : "0" }} />
                    </div>
                    <div className="w-10 text-sm text-right">{stage.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Navigate to key sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start"><Link href="/leads">View Leads</Link></Button>
              {isAdmin && (
                <>
                  <Button asChild variant="outline" className="w-full justify-start"><Link href="/leads/import">Import Leads</Link></Button>
                  <Button asChild variant="outline" className="w-full justify-start"><Link href="/admin/staff">Manage Staff</Link></Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {followUpsDue.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Follow-ups Due Today</CardTitle>
                <CardDescription>{followUpsDue.length} follow-up(s) scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {followUpsDue.map((fu) => (
                    <div key={fu.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{fu.lead.businessName}</p>
                        <p className="text-sm text-muted-foreground">{fu.lead.city} · {fu.staff.name}</p>
                      </div>
                      <Button asChild size="sm" variant="outline"><Link href={`/leads/${fu.lead.id}`}>View Lead</Link></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && leaderboard && leaderboard.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Staff Leaderboard</CardTitle>
                <CardDescription>Performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.role}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span><strong>{s.totalAssigned}</strong> assigned</span>
                        <span><strong>{s.conversions}</strong> converted</span>
                        <span><strong>{s.pendingFollowUps}</strong> pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
