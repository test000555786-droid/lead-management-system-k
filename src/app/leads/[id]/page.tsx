import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getLeadById, assignLeadFormAction, claimLeadFormAction, getActiveStaff, handleSignOut } from "@/lib/actions";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { StatusChangeForm } from "@/components/status-change-form";
import { Timeline } from "@/components/timeline";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPhoneForDisplay, getWhatsAppLink } from "@/lib/utils";
import Link from "next/link";
import { Phone, MessageCircle, ExternalLink } from "lucide-react";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  let lead;
  try { lead = await getLeadById(id); }
  catch { notFound(); }

  const staffList = isAdmin ? await getActiveStaff() : [];

  const timelineItems = [
    ...lead.followUps.map((f) => ({
      id: f.id, type: "followup" as const, createdAt: f.createdAt,
      title: `Follow-up by ${f.staff.name}`, description: f.notes,
      meta: f.nextFollowUpAt ? `Next follow-up: ${new Date(f.nextFollowUpAt).toLocaleString()}` : undefined,
    })),
    ...lead.activityLogs.map((a) => ({
      id: a.id, type: "activity" as const, createdAt: a.createdAt,
      title: a.action.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: a.detail, meta: `By ${a.user.name}`,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/leads"><Button variant="ghost" size="sm">← Leads</Button></Link>
            <h1 className="text-xl font-bold">Lead Detail</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name} ({session.user.role})</span>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold">{lead.businessName}</h2>
          <LeadStatusBadge status={lead.status} />
          <span className="text-sm text-muted-foreground">{lead.category}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border p-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatPhoneForDisplay(lead.phone)}</p>
                  {lead.contactPerson && <p className="text-sm text-muted-foreground">{lead.contactPerson}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild><a href={`tel:${lead.phone}`}><Phone className="h-4 w-4" /></a></Button>
                  <Button variant="ghost" size="icon" asChild><a href={getWhatsAppLink(lead.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>
                </div>
              </div>
              {lead.altPhone && <p className="text-sm text-muted-foreground">Alt: {formatPhoneForDisplay(lead.altPhone)}</p>}
              {lead.email && <p className="text-sm"><a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a></p>}
              {lead.website && <p className="text-sm"><a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">{lead.website} <ExternalLink className="h-3 w-3" /></a></p>}
              {lead.address && <p className="text-sm text-muted-foreground">{lead.address}</p>}
            </div>
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Location</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">City:</span> {lead.city}</p>
              <p><span className="text-muted-foreground">State:</span> {lead.state}</p>
              <p><span className="text-muted-foreground">Country:</span> {lead.country}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-md border p-4 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Update Status</h3>
            <StatusChangeForm leadId={lead.id} currentStatus={lead.status} onSuccess={() => {}} />
          </div>

          <div className="rounded-md border p-4 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Assignment</h3>
            <p className="text-sm">{lead.assignedTo ? `Assigned to: ${lead.assignedTo.name}` : "Unassigned"}</p>
            {isAdmin && (
              <form action={assignLeadFormAction} className="space-y-2">
                <input type="hidden" name="leadId" value={lead.id} />
                <Select name="assignedToId">
                  <SelectTrigger><SelectValue placeholder="Assign to..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="submit" size="sm">Update Assignment</Button>
              </form>
            )}
            {!isAdmin && lead.assignedToId === null && (
              <form action={claimLeadFormAction}>
                <input type="hidden" name="leadId" value={lead.id} />
                <Button type="submit" size="sm">Claim Lead</Button>
              </form>
            )}
            {!isAdmin && lead.assignedToId === session.user.id && (
              <form action={assignLeadFormAction}>
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="assignedToId" value="unassigned" />
                <Button type="submit" variant="outline" size="sm">Release Lead</Button>
              </form>
            )}
          </div>
        </div>

        {lead.denyReason && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4">
            <h3 className="text-sm font-semibold text-red-800">Deny Reason</h3>
            <p className="text-sm text-red-700 mt-1"><span className="font-medium">{lead.denyReason.category}</span>{lead.denyReason.details && `: ${lead.denyReason.details}`}</p>
          </div>
        )}

        {lead.notes && (
          <div className="rounded-md border p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notes</h3>
            <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
          </div>
        )}

        <div className="rounded-md border p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Timeline</h3>
          <Timeline items={timelineItems} />
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>Created by {lead.createdBy.name} on {new Date(lead.createdAt).toLocaleString()}</p>
          <p>Last updated: {new Date(lead.updatedAt).toLocaleString()}</p>
          {lead.importBatch && <p>Imported from {lead.importBatch.source}{lead.importBatch.fileName ? ` (${lead.importBatch.fileName})` : ""}</p>}
        </div>
      </main>
    </div>
  );
}
