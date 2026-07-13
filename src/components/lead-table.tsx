"use client";

import { useState } from "react";
import { LeadStatus } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadStatusBadge, statusColorMap } from "@/components/lead-status-badge";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { formatPhoneForDisplay } from "@/lib/utils";
import { bulkAssignLeads } from "@/lib/actions";
import { useTransition } from "react";

type LeadRow = {
  id: string;
  businessName: string;
  city: string;
  state: string;
  category: string;
  status: LeadStatus;
  phone: string;
  contactPerson: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { followUps: number };
  followUps: { createdAt: Date; notes: string }[];
};

export function LeadTable({ leads, isAdmin, currentUserId, staffList = [] }: { leads: LeadRow[]; isAdmin: boolean; currentUserId: string; staffList?: { id: string; name: string }[] }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [bulkAssignTo, setBulkAssignTo] = useState<string>("");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedLeads);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedLeads(next);
  };

  const handleBulkAssign = () => {
    if (selectedLeads.size === 0 || !bulkAssignTo) return;
    
    startTransition(async () => {
      try {
        const targetId = bulkAssignTo === "unassigned" ? null : bulkAssignTo;
        const res = await bulkAssignLeads(Array.from(selectedLeads), targetId);
        if (res.success) {
          setSelectedLeads(new Set());
          setBulkAssignTo("");
        }
      } catch (error) {
        alert("Failed to bulk assign leads");
      }
    });
  };

  return (
    <div className="space-y-4">
      {isAdmin && selectedLeads.size > 0 && (
        <div className="bg-[var(--crm-accent-tint)] border border-[var(--crm-accent)]/20 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--crm-accent)]">
            {selectedLeads.size} lead{selectedLeads.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-3">
            <Select value={bulkAssignTo} onValueChange={setBulkAssignTo} disabled={isPending}>
              <SelectTrigger className="w-[180px] h-9 bg-white shadow-sm border-[var(--crm-border)]">
                <SelectValue placeholder="Select staff..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              size="sm" 
              onClick={handleBulkAssign} 
              disabled={!bulkAssignTo || isPending}
              className="bg-[var(--crm-accent)] hover:bg-[var(--crm-accent-hover)] text-white shadow-sm"
            >
              {isPending ? "Assigning..." : "Assign Selected"}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[var(--crm-border)] hover:bg-transparent">
              {isAdmin && (
                <TableHead className="w-12 text-center h-10 px-0 pl-4">
                  <Checkbox 
                    checked={leads.length > 0 && selectedLeads.size === leads.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead className="w-8 text-center uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10 px-0 pl-2">#</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10 pl-2">Business</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Contact</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Phone</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">City</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">State</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Category</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Status</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Assigned</TableHead>
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="h-24 text-center text-muted-foreground">No leads found</TableCell>
              </TableRow>
            )}
            {leads.map((lead, index) => (
              <TableRow 
                key={lead.id} 
                className={`cursor-pointer border-b-[var(--crm-border)] hover:bg-slate-50/50 transition-colors relative ${selectedLeads.has(lead.id) ? "bg-[var(--crm-accent-tint)]/50" : ""}`}
                onClick={() => setSelectedLeadId(lead.id)}
              >
                {isAdmin && (
                  <TableCell className="w-12 text-center px-0 pl-4 relative" onClick={(e) => e.stopPropagation()}>
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[3px]" 
                      style={{ backgroundColor: statusColorMap[lead.status] }}
                    />
                    <Checkbox 
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={(checked) => handleSelectOne(lead.id, checked as boolean)}
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                <TableCell className="w-8 text-center text-xs font-medium text-[var(--crm-text-secondary)] tabular-nums px-0 pl-2 relative">
                  {!isAdmin && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-[3px]" 
                      style={{ backgroundColor: statusColorMap[lead.status] }}
                    />
                  )}
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium text-[var(--crm-text-primary)] relative pl-2">
                  <span className={isAdmin ? "" : "pl-2"}>{lead.businessName}</span>
                </TableCell>
                <TableCell className="text-[var(--crm-text-primary)]">{lead.contactPerson || "—"}</TableCell>
                <TableCell className="tabular-nums text-[var(--crm-text-primary)]">{formatPhoneForDisplay(lead.phone)}</TableCell>
                <TableCell className="text-[var(--crm-text-secondary)]">{lead.city}</TableCell>
                <TableCell className="text-[var(--crm-text-secondary)]">{lead.state}</TableCell>
                <TableCell className="text-[var(--crm-text-secondary)]">{lead.category}</TableCell>
                <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
                <TableCell>{lead.assignedTo ? <span className="text-[var(--crm-text-primary)]">{lead.assignedTo.name}</span> : <span className="text-xs text-muted-foreground uppercase tracking-wider">Unassigned</span>}</TableCell>
                <TableCell className="text-xs text-[var(--crm-text-secondary)] tabular-nums" suppressHydrationWarning>
                  {lead.followUps.length > 0 ? new Date(lead.followUps[0].createdAt).toLocaleDateString() : new Date(lead.updatedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedLeadId && (
        <LeadDetailSheet leadId={selectedLeadId} open={!!selectedLeadId} onOpenChange={(open) => !open && setSelectedLeadId(null)} isAdmin={isAdmin} currentUserId={currentUserId} />
      )}
    </div>
  );
}
