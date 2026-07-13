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
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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

  const hasFilters = searchParams.toString().length > 0 && searchParams.toString() !== `search=${searchParams.get("search") || ""}`;

  const renderFilters = (isMobile: boolean = false) => (
    <>
      <Select value={searchParams.get("status") || ""} onValueChange={(v) => setFilter("status", v)}>
        <SelectTrigger className={`w-full md:w-[130px] h-9 border-[var(--crm-border)] md:border-0 md:bg-transparent shadow-none focus:ring-0 text-[var(--crm-text-primary)] ${isMobile ? "mb-3" : ""}`}><SelectValue placeholder="Status" /></SelectTrigger>
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
        <SelectTrigger className={`w-full md:w-[110px] h-9 border-[var(--crm-border)] md:border-0 md:bg-transparent shadow-none focus:ring-0 text-[var(--crm-text-primary)] ${isMobile ? "mb-3" : ""}`}><SelectValue placeholder="City" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Cities</SelectItem>
          {options.cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("state") || ""} onValueChange={(v) => setFilter("state", v)}>
        <SelectTrigger className={`w-full md:w-[110px] h-9 border-[var(--crm-border)] md:border-0 md:bg-transparent shadow-none focus:ring-0 text-[var(--crm-text-primary)] ${isMobile ? "mb-3" : ""}`}><SelectValue placeholder="State" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All States</SelectItem>
          {options.states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("category") || ""} onValueChange={(v) => setFilter("category", v)}>
        <SelectTrigger className={`w-full md:w-[130px] h-9 border-[var(--crm-border)] md:border-0 md:bg-transparent shadow-none focus:ring-0 text-[var(--crm-text-primary)] ${isMobile ? "mb-3" : ""}`}><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Categories</SelectItem>
          {options.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      {options.isAdmin && (
        <Select value={searchParams.get("assignedTo") || ""} onValueChange={(v) => setFilter("assignedTo", v)}>
          <SelectTrigger className={`w-full md:w-[140px] h-9 border-[var(--crm-border)] md:border-0 md:bg-transparent shadow-none focus:ring-0 text-[var(--crm-text-primary)] ${isMobile ? "mb-3" : ""}`}><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Staff</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {options.staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className={`h-9 px-2 text-[var(--crm-text-secondary)] hover:text-[var(--crm-text-primary)] ${isMobile ? "w-full justify-center mt-2 border border-[var(--crm-border)]" : ""}`}>
          <X className="mr-1 h-4 w-4" /> Clear Filters
        </Button>
      )}
    </>
  );

  return (
    <div className="bg-[var(--crm-surface)] border border-[var(--crm-border)] rounded-lg p-2 shadow-sm flex items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--crm-text-secondary)]" />
        <Input
          placeholder="Search business, phone, contact..."
          className="pl-9 pr-3 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
          value={searchParams.get("search") || ""}
          onChange={(e) => setFilter("search", e.target.value)}
        />
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:flex flex-wrap items-center gap-2 border-l border-[var(--crm-border)] pl-3">
        {renderFilters()}
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3 gap-2 border-[var(--crm-border)]">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader className="mb-6">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col">
              {renderFilters(true)}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isPending && <p className="hidden md:block text-xs text-muted-foreground ml-2">Updating...</p>}
    </div>
  );
}
