import LeadsPage from "../leads/page";

export default async function MyLeadsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  
  // Force assignedTo to be "me" while keeping any other filter the user applies
  return (
    <LeadsPage 
      searchParams={Promise.resolve({ 
        ...resolvedSearchParams, 
        assignedTo: "me" 
      })} 
    />
  );
}
