"use client";

import { LeadStatus } from "@prisma/client";

export const statusColorMap: Record<LeadStatus, string> = {
  NEW: "var(--status-new)",
  CONTACTED: "var(--status-contacted)",
  FOLLOW_UP: "var(--status-follow-up)",
  INTERESTED: "var(--status-interested)",
  CONVERTED: "var(--status-converted)",
  NOT_INTERESTED: "var(--status-not-interested)",
  NOT_ANSWERED: "var(--status-not-answered)",
  NOT_REACHABLE: "var(--status-not-reachable)",
};

export const statusLabelMap: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow Up",
  INTERESTED: "Interested",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not Interested",
  NOT_ANSWERED: "Not Answered",
  NOT_REACHABLE: "Customer Busy/Not Reachable/Not connected",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[var(--crm-border)] bg-[var(--crm-surface)] text-xs font-medium text-[var(--crm-text-primary)] shadow-sm whitespace-nowrap">
      <div 
        className="h-1.5 w-1.5 rounded-full" 
        style={{ backgroundColor: statusColorMap[status] }}
      />
      {statusLabelMap[status]}
    </div>
  );
}
