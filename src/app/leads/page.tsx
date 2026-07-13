import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeads, getFilterOptions, getActiveStaff, handleSignOut } from "@/lib/actions";
import { LeadFilters } from "@/components/lead-filters";
import { LeadTable } from "@/components/lead-table";
import { AddLeadDialog } from "@/components/add-lead-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const params = {
    city: typeof resolvedSearchParams.city === "string" ? resolvedSearchParams.city : undefined,
    state: typeof resolvedSearchParams.state === "string" ? resolvedSearchParams.state : undefined,
    country: typeof resolvedSearchParams.country === "string" ? resolvedSearchParams.country : undefined,
    category: typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : undefined,
    status: typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : undefined,
    assignedTo: typeof resolvedSearchParams.assignedTo === "string" ? resolvedSearchParams.assignedTo : undefined,
    search: typeof resolvedSearchParams.search === "string" ? resolvedSearchParams.search : undefined,
    from: typeof resolvedSearchParams.from === "string" ? resolvedSearchParams.from : undefined,
    to: typeof resolvedSearchParams.to === "string" ? resolvedSearchParams.to : undefined,
  };

  if (params.assignedTo === "unassigned") params.assignedTo = "null";

  const [leads, filterOptions, staffList] = await Promise.all([
    getLeads(params),
    getFilterOptions(),
    isAdmin ? getActiveStaff() : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
            <h1 className="text-xl font-bold">Leads</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{session.user.name} ({session.user.role})</span>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" size="sm">Sign out</Button>
            </form>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">All Leads</h2>
            <p className="text-muted-foreground">{leads.length} lead{leads.length !== 1 ? "s" : ""} found</p>
          </div>
          <AddLeadDialog />
        </div>

        <LeadFilters options={{
          cities: filterOptions.cities,
          states: filterOptions.states,
          countries: filterOptions.countries,
          categories: filterOptions.categories,
          staff: staffList.map((s) => ({ id: s.id, name: s.name })),
          isAdmin,
        }} />

        <LeadTable leads={leads} isAdmin={isAdmin} currentUserId={session.user.id} />
      </main>
    </div>
  );
}
