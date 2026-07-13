import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats, getFunnelData, getFollowUpsDueToday, getStaffLeaderboard, handleSignOut } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { Sidebar } from "@/components/sidebar";
import { Users, Calendar, Percent, Clock } from "lucide-react";

const statusColorMap: Record<string, string> = {
  NEW: "var(--status-new)",
  CONTACTED: "var(--status-contacted)",
  FOLLOW_UP: "var(--status-follow-up)",
  INTERESTED: "var(--status-interested)",
  CONVERTED: "var(--status-converted)",
  NOT_INTERESTED: "var(--status-not-interested)",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const stats = await getDashboardStats();
  const funnel = await getFunnelData();
  const followUpsDue = await getFollowUpsDueToday();
  const leaderboard = isAdmin ? await getStaffLeaderboard() : null;

  return (
    <div className="flex min-h-screen bg-[var(--crm-bg)]">
      <Sidebar user={{ name: session.user.name || "", role: session.user.role || "" }} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 border-b border-[var(--crm-border)] bg-[var(--crm-surface)] px-6 py-4 flex items-center md:min-h-[73px]">
          <h1 className="text-xl font-bold ml-12 md:ml-0 text-[var(--crm-text-primary)]">Dashboard</h1>
        </header>

      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your leads and activity</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm border-[var(--crm-border)] rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--crm-text-secondary)]">Total Leads</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-[700] tabular-nums text-[var(--crm-text-primary)]">{stats.totalLeads}</div>
              <p className="text-xs text-[var(--crm-text-secondary)] mt-1">All time</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-[var(--crm-border)] rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--crm-text-secondary)]">New This Week</CardTitle>
              <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Calendar className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-[700] tabular-nums text-[var(--crm-text-primary)]">{stats.newThisWeek}</div>
              <p className="text-xs text-[var(--crm-text-secondary)] mt-1">Last 7 days</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-[var(--crm-border)] rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--crm-text-secondary)]">Conversion Rate</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <Percent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-[700] tabular-nums text-[var(--crm-text-primary)]">{stats.conversionRate}%</div>
              <p className="text-xs text-[var(--crm-text-secondary)] mt-1">{stats.convertedLeads} converted</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-[var(--crm-border)] rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--crm-text-secondary)]">Follow-ups Due</CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-[700] tabular-nums text-[var(--crm-text-primary)]">{stats.followUpsDue}</div>
              <p className="text-xs text-[var(--crm-text-secondary)] mt-1">Due today</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="shadow-sm border-[var(--crm-border)] rounded-xl">
            <CardHeader>
              <CardTitle>Pipeline Funnel</CardTitle>
              <CardDescription>Lead distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnel.map((stage) => (
                  <div key={stage.status} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-medium text-[var(--crm-text-secondary)]">{stage.name}</div>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ 
                          width: `${stats.totalLeads > 0 ? (stage.count / stats.totalLeads) * 100 : 0}%`, 
                          minWidth: stage.count > 0 ? "4px" : "0",
                          backgroundColor: statusColorMap[stage.status] || "var(--crm-accent)"
                        }} 
                      />
                    </div>
                    <div className="w-12 text-sm text-right tabular-nums font-medium">{stage.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {followUpsDue.length > 0 && (
          <div className="mt-8">
            <Card className="shadow-sm border-[var(--crm-border)] rounded-xl">
              <CardHeader>
                <CardTitle>Follow-ups Due Today</CardTitle>
                <CardDescription>{followUpsDue.length} follow-up(s) scheduled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {followUpsDue.map((fu) => (
                    <div key={fu.id} className="flex items-center justify-between rounded-lg border border-[var(--crm-border)] p-4 bg-[var(--crm-surface)]">
                      <div>
                        <p className="font-medium text-[var(--crm-text-primary)]">{fu.lead.businessName}</p>
                        <p className="text-sm text-[var(--crm-text-secondary)]">{fu.lead.city} · {fu.staff.name}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="border-[var(--crm-border)] shadow-sm"><Link href={`/leads/${fu.lead.id}`}>View Lead</Link></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isAdmin && leaderboard && leaderboard.length > 0 && (
          <div className="mt-8">
            <Card className="shadow-sm border-[var(--crm-border)] rounded-xl">
              <CardHeader>
                <CardTitle>Staff Leaderboard</CardTitle>
                <CardDescription>Performance overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leaderboard.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-[var(--crm-border)] p-4 bg-[var(--crm-surface)]">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--crm-text-primary)]">{s.name}</p>
                          <p className="text-xs text-[var(--crm-text-secondary)] uppercase tracking-wider">{s.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <span className="flex flex-col items-center">
                          <strong className="text-lg tabular-nums">{s.totalAssigned}</strong> 
                          <span className="text-[10px] uppercase text-[var(--crm-text-secondary)] tracking-wider">Assigned</span>
                        </span>
                        <span className="flex flex-col items-center">
                          <strong className="text-lg tabular-nums text-[var(--status-converted)]">{s.conversions}</strong> 
                          <span className="text-[10px] uppercase text-[var(--crm-text-secondary)] tracking-wider">Converted</span>
                        </span>
                        <span className="flex flex-col items-center">
                          <strong className="text-lg tabular-nums">{s.pendingFollowUps}</strong> 
                          <span className="text-[10px] uppercase text-[var(--crm-text-secondary)] tracking-wider">Pending</span>
                        </span>
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
    </div>
  );
}
