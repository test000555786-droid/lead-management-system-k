import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStaffDashboard } from "@/lib/actions";
import { Sidebar } from "@/components/sidebar";
import Link from "next/link";
import { ChevronLeft, Activity, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { formatPhoneForDisplay } from "@/lib/utils";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const data = await getStaffDashboard(resolvedParams.id);
  const { staff, assignedLeads, recentActivity } = data;

  return (
    <div className="flex min-h-screen bg-[var(--crm-bg)]">
      <Sidebar user={{ name: session.user.name || "", role: session.user.role || "" }} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-[var(--crm-border)] bg-[var(--crm-surface)] px-6 py-4 flex items-center md:min-h-[73px]">
          <Link href="/admin/staff" className="mr-4 text-muted-foreground hover:text-[var(--crm-accent)] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="h-8 w-8 rounded-full bg-[var(--crm-accent-tint)] text-[var(--crm-accent)] flex items-center justify-center font-bold mr-3 shrink-0">
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--crm-text-primary)] leading-tight">{staff.name}</h1>
            <p className="text-xs text-muted-foreground">{staff.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={staff.role === "ADMIN" ? "default" : "secondary"} className="uppercase tracking-wide text-[10px]">
              {staff.role}
            </Badge>
            <Badge variant="outline" className={`uppercase tracking-wide text-[10px] ${staff.active ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-red-600 border-red-200 bg-red-50"}`}>
              {staff.active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </header>

        <main className="p-6">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="mb-6 w-full max-w-[400px] grid grid-cols-2">
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="leads" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Leads
                <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center">
                  {assignedLeads.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>Most recent actions performed by {staff.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                      No recent activity found.
                    </div>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {recentActivity.map((log) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[var(--crm-surface)] shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-[var(--crm-accent)]">
                            <Activity className="h-4 w-4" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[var(--crm-border)] bg-white shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm text-[var(--crm-text-primary)]">{log.action === "status_changed" ? "Updated Status" : log.action === "assigned" ? "Assignment" : "Note Added"}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(log.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--crm-text-secondary)] mt-1">
                              {log.detail}
                            </p>
                            <Link href={`/leads/${log.lead.id}`} className="inline-block mt-3 text-xs font-medium text-[var(--crm-accent)] hover:underline">
                              View {log.lead.businessName} &rarr;
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads">
              <Card>
                <CardHeader>
                  <CardTitle>Currently Assigned Leads</CardTitle>
                  <CardDescription>Leads currently in {staff.name}'s pipeline</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-y border-[var(--crm-border)]">
                        <tr>
                          <th className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Business</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Contact</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">City</th>
                          <th className="px-4 py-3 font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--crm-border)]">
                        {assignedLeads.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                              No leads currently assigned.
                            </td>
                          </tr>
                        ) : (
                          assignedLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 font-medium">
                                <Link href={`/leads/${lead.id}`} className="hover:text-[var(--crm-accent)] hover:underline">
                                  {lead.businessName}
                                </Link>
                              </td>
                              <td className="px-4 py-3 text-[var(--crm-text-secondary)]">
                                {lead.contactPerson || "—"}
                                <div className="text-xs tabular-nums text-muted-foreground">{formatPhoneForDisplay(lead.phone)}</div>
                              </td>
                              <td className="px-4 py-3 text-[var(--crm-text-secondary)]">{lead.city}</td>
                              <td className="px-4 py-3">
                                <LeadStatusBadge status={lead.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
