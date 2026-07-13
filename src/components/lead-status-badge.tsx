"use client";

import { Badge } from "@/components/ui/badge";
import { LeadStatus } from "@prisma/client";

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  CONTACTED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  FOLLOW_UP: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  INTERESTED: "bg-teal-100 text-teal-800 hover:bg-teal-100",
  CONVERTED: "bg-green-100 text-green-800 hover:bg-green-100",
  NOT_INTERESTED: "bg-red-100 text-red-800 hover:bg-red-100",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge className={statusColors[status]} variant="outline">
      {status.replace("_", " ")}
    </Badge>
  );
}
