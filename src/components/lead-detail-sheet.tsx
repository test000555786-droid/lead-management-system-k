"use client";

import { useEffect, useState, useCallback } from "react";
import { getLeadById, assignLead, addFollowUp, getActiveStaff } from "@/lib/actions";
import { formatPhoneForDisplay, getWhatsAppLink } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LeadStatusBadge } from "@/components/lead-status-badge";
import { StatusChangeForm } from "@/components/status-change-form";
import { Timeline } from "@/components/timeline";
import { Copy, Phone, MessageCircle, ExternalLink, Check, Loader2 } from "lucide-react";

type LeadDetail = Awaited<ReturnType<typeof getLeadById>>;

export function LeadDetailSheet({ leadId, open, onOpenChange, isAdmin, currentUserId }: {
  leadId: string; open: boolean; onOpenChange: (open: boolean) => void; isAdmin: boolean; currentUserId: string;
}) {
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const [data, staff] = await Promise.all([
        getLeadById(leadId),
        isAdmin ? getActiveStaff() : Promise.resolve([]),
      ]);
      setLead(data);
      setStaffList(staff.map((s) => ({ id: s.id, name: s.name })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [leadId, open, isAdmin]);

  useEffect(() => { fetchLead(); }, [fetchLead]);

  async function handleCopyPhone() {
    if (!lead) return;
    await navigator.clipboard.writeText(lead.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleAssign(assignedToId: string | null) {
    if (!lead) return;
    setAssignLoading(true);
    try { await assignLead(lead.id, assignedToId); await fetchLead(); }
    catch (err) { alert(err instanceof Error ? err.message : "Failed to assign"); }
    finally { setAssignLoading(false); }
  }

  async function handleAddFollowUp() {
    if (!lead || !followUpNote.trim()) return;
    setFollowUpLoading(true);
    try {
      await addFollowUp(lead.id, followUpNote, followUpDate || undefined);
      setFollowUpNote(""); setFollowUpDate(""); await fetchLead();
    } catch (err) { alert(err instanceof Error ? err.message : "Failed to add follow-up"); }
    finally { setFollowUpLoading(false); }
  }

  if (loading || !lead) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        </SheetContent>
      </Sheet>
    );
  }

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

  const isAssignedToMe = lead.assignedToId === currentUserId;
  const isUnassigned = lead.assignedToId === null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            {lead.businessName} <LeadStatusBadge status={lead.status} />
          </SheetTitle>
          <SheetDescription>{lead.category} · {lead.city}, {lead.state}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{formatPhoneForDisplay(lead.phone)}</p>
                  {lead.contactPerson && <p className="text-xs text-muted-foreground">{lead.contactPerson}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={handleCopyPhone}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" asChild><a href={`tel:${lead.phone}`}><Phone className="h-4 w-4" /></a></Button>
                  <Button variant="ghost" size="icon" asChild><a href={getWhatsAppLink(lead.phone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>
                </div>
              </div>
              {lead.altPhone && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <p className="text-sm font-medium">Alt: {formatPhoneForDisplay(lead.altPhone)}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" asChild><a href={`tel:${lead.altPhone}`}><Phone className="h-4 w-4" /></a></Button>
                    <Button variant="ghost" size="icon" asChild><a href={getWhatsAppLink(lead.altPhone)} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /></a></Button>
                  </div>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <p className="text-sm">{lead.email}</p>
                  <Button variant="ghost" size="icon" asChild><a href={`mailto:${lead.email}`}><ExternalLink className="h-4 w-4" /></a></Button>
                </div>
              )}
              {lead.website && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <p className="text-sm truncate max-w-[200px]">{lead.website}</p>
                  <Button variant="ghost" size="icon" asChild><a href={lead.website} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>
                </div>
              )}
              {lead.address && <p className="text-sm text-muted-foreground">{lead.address}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Assignment</h3>
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Select value={lead.assignedToId || "unassigned"} onValueChange={(v) => handleAssign(v === "unassigned" ? null : v)} disabled={assignLoading}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {staffList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {assignLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm">{lead.assignedTo ? `Assigned to: ${lead.assignedTo.name}` : "Unassigned"}</p>
                {isUnassigned && (
                  <Button size="sm" onClick={() => handleAssign(currentUserId)} disabled={assignLoading}>
                    {assignLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Claim
                  </Button>
                )}
                {isAssignedToMe && (
                  <Button size="sm" variant="outline" onClick={() => handleAssign(null)} disabled={assignLoading}>Release</Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Update Status</h3>
            <StatusChangeForm leadId={lead.id} currentStatus={lead.status} onSuccess={fetchLead} />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick Follow-up</h3>
            <Textarea placeholder="Add a follow-up note..." value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} className="min-h-[60px]" />
            <div className="flex items-center gap-2">
              <Input type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-auto" />
              <Button onClick={handleAddFollowUp} disabled={!followUpNote.trim() || followUpLoading}>
                {followUpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Follow-up
              </Button>
            </div>
          </div>

          {lead.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {lead.denyReason && (
            <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
              <h3 className="text-sm font-semibold text-red-800">Deny Reason</h3>
              <p className="text-sm text-red-700"><span className="font-medium">{lead.denyReason.category}</span>{lead.denyReason.details && `: ${lead.denyReason.details}`}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Timeline</h3>
            <Timeline items={timelineItems} />
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
            <p>Created by {lead.createdBy.name} on {new Date(lead.createdAt).toLocaleString()}</p>
            {lead.importBatch && <p>Imported from {lead.importBatch.source}{lead.importBatch.fileName ? ` (${lead.importBatch.fileName})` : ""}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
