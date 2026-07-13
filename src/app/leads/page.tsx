import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeads, getFilterOptions, getActiveStaff } from "@/lib/actions";
import { LeadFilters } from "@/components/lead-filters";
import { LeadTable } from "@/components/lead-table";
import { AddLeadDialog } from "@/components/add-lead-dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function LeadsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const params = {
    city: typeof searchParams.city === "string" ? searchParams.city : undefined,
    state: typeof searchParams.state === "string" ? searchParams.state : undefined,
    country: typeof searchParams.country === "string" ? searchParams.country : undefined,
    category: typeof searchParams.category === "string" ? searchParams.category : undefined,
    status: typeof searchParams.status === "string" ? searchParams.status : undefined,
    assignedTo: typeof searchParams.assignedTo === "string" ? searchParams.assignedTo : undefined,
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    from: typeof searchParams.from === "string" ? searchParams.from : undefined,
    to: typeof searchParams.to === "string" ? searchParams.to : undefined,
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
            <form action="/api/auth/signout" method="POST">
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
