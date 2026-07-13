"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toggleStaffActive } from "@/lib/actions";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: Date;
  _count: { leadsAssigned: number };
};

export function StaffTable({ staff, currentUserId }: { staff: StaffMember[]; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(userId: string, currentActive: boolean) {
    startTransition(async () => {
      try { await toggleStaffActive(userId, !currentActive); }
      catch (err) { alert(err instanceof Error ? err.message : "Failed to update"); }
    });
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Leads Assigned</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No staff members yet</TableCell>
            </TableRow>
          )}
          {staff.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell><Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>{member.role}</Badge></TableCell>
              <TableCell>{member._count.leadsAssigned}</TableCell>
              <TableCell><Badge variant={member.active ? "default" : "destructive"}>{member.active ? "Active" : "Inactive"}</Badge></TableCell>
              <TableCell>
                <Switch checked={member.active} disabled={member.id === currentUserId || isPending} onCheckedChange={() => handleToggle(member.id, member.active)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
