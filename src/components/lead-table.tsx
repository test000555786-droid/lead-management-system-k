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
import { LeadStatusBadge, statusColorMap } from "@/components/lead-status-badge";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { formatPhoneForDisplay } from "@/lib/utils";

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

export function LeadTable({ leads, isAdmin, currentUserId }: { leads: LeadRow[]; isAdmin: boolean; currentUserId: string }) {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b-[var(--crm-border)] hover:bg-transparent">
              <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Business</TableHead>
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
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No leads found</TableCell>
              </TableRow>
            )}
            {leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="cursor-pointer border-b-[var(--crm-border)] hover:bg-slate-50/50 transition-colors relative" 
                onClick={() => setSelectedLeadId(lead.id)}
              >
                <TableCell className="font-medium text-[var(--crm-text-primary)] relative">
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-[3px]" 
                    style={{ backgroundColor: statusColorMap[lead.status] }}
                  />
                  <span className="pl-2">{lead.businessName}</span>
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
    </>
  );
}
