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
import { LeadStatusBadge } from "@/components/lead-status-badge";
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Last Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No leads found</TableCell>
              </TableRow>
            )}
            {leads.map((lead) => (
              <TableRow key={lead.id} className="cursor-pointer" onClick={() => setSelectedLeadId(lead.id)}>
                <TableCell className="font-medium">{lead.businessName}</TableCell>
                <TableCell>{lead.contactPerson || "—"}</TableCell>
                <TableCell>{formatPhoneForDisplay(lead.phone)}</TableCell>
                <TableCell>{lead.city}</TableCell>
                <TableCell>{lead.state}</TableCell>
                <TableCell>{lead.category}</TableCell>
                <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
                <TableCell>{lead.assignedTo ? lead.assignedTo.name : <span className="text-xs text-muted-foreground">Unassigned</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground" suppressHydrationWarning>
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
