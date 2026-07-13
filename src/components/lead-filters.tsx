"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface FilterOptions {
  cities: string[];
  states: string[];
  countries: string[];
  categories: string[];
  staff: { id: string; name: string }[];
  isAdmin: boolean;
}

export function LeadFilters({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) { params.set(name, value); } else { params.delete(name); }
      return params.toString();
    },
    [searchParams]
  );

  function setFilter(name: string, value: string) {
    startTransition(() => { router.push(`?${createQueryString(name, value)}`); });
  }

  function clearFilters() {
    startTransition(() => { router.push("/leads"); });
  }

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search business, phone, contact..."
            className="pl-8"
            value={searchParams.get("search") || ""}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={searchParams.get("status") || ""} onValueChange={(v) => setFilter("status", v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
            <SelectItem value="INTERESTED">Interested</SelectItem>
            <SelectItem value="CONVERTED">Converted</SelectItem>
            <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
          </SelectContent>
        </Select>

        <Select value={searchParams.get("city") || ""} onValueChange={(v) => setFilter("city", v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Cities</SelectItem>
            {options.cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("state") || ""} onValueChange={(v) => setFilter("state", v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All States</SelectItem>
            {options.states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={searchParams.get("category") || ""} onValueChange={(v) => setFilter("category", v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {options.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        {options.isAdmin && (
          <Select value={searchParams.get("assignedTo") || ""} onValueChange={(v) => setFilter("assignedTo", v)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Assigned To" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Staff</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {options.staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      {isPending && <p className="text-xs text-muted-foreground">Updating...</p>}
    </div>
  );
}
