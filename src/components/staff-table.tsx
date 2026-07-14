"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toggleStaffActive, toggleStaffViewAllLeads } from "@/lib/actions";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  canViewAllLeads: boolean;
  _count: { leadsAssigned: number };
  activeTimeToday?: number;
};

function formatDuration(seconds?: number) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function StaffTable({ staff, currentUserId }: { staff: StaffMember[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(userId: string, currentActive: boolean) {
    startTransition(async () => {
      try { await toggleStaffActive(userId, !currentActive); }
      catch (err) { alert(err instanceof Error ? err.message : "Failed to update"); }
    });
  }

  function handleToggleViewAll(userId: string, currentCanViewAll: boolean) {
    startTransition(async () => {
      try { await toggleStaffViewAllLeads(userId, !currentCanViewAll); }
      catch (err) { alert(err instanceof Error ? err.message : "Failed to update"); }
    });
  }

  return (
    <div className="rounded-xl border border-[var(--crm-border)] bg-[var(--crm-surface)] shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b-[var(--crm-border)] hover:bg-transparent">
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Name</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Email</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Role</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Active Today</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Leads Assigned</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Status</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">Active</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10">View All Leads</TableHead>
            <TableHead className="uppercase text-[10px] tracking-wider text-[var(--crm-text-secondary)] font-medium h-10 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">No staff members yet</TableCell>
            </TableRow>
          )}
          {staff.map((member) => (
            <TableRow key={member.id} className="border-b-[var(--crm-border)] hover:bg-slate-50/50 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700 text-xs">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-[var(--crm-text-primary)]">{member.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-[var(--crm-text-secondary)]">{member.email}</TableCell>
              <TableCell>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${member.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-700"}`}>
                  {member.role}
                </div>
              </TableCell>
              <TableCell className="tabular-nums text-[var(--crm-text-primary)] font-medium">
                {formatDuration(member.activeTimeToday)}
              </TableCell>
              <TableCell className="tabular-nums font-medium text-[var(--crm-text-primary)]">{member._count.leadsAssigned}</TableCell>
              <TableCell>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${member.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {member.active ? "Active" : "Inactive"}
                </div>
              </TableCell>
              <TableCell>
                <Switch checked={member.active} disabled={member.id === currentUserId || isPending} onCheckedChange={() => handleToggle(member.id, member.active)} />
              </TableCell>
              <TableCell>
                {member.role === "STAFF" ? (
                  <Switch checked={member.canViewAllLeads} disabled={isPending} onCheckedChange={() => handleToggleViewAll(member.id, member.canViewAllLeads)} />
                ) : (
                  <span className="text-muted-foreground text-xs">N/A</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild className="text-[var(--crm-accent)] hover:text-[var(--crm-accent-hover)] hover:bg-[var(--crm-accent-tint)]">
                  <Link href={`/admin/staff/${member.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
