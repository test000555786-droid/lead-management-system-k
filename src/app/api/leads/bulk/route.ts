import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leads, source } = await req.json();

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }

    // Create an import batch
    const batch = await prisma.importBatch.create({
      data: {
        source: source || "unknown",
        rowCount: leads.length,
        importedById: session.user.id,
      },
    });

    // Prepare leads for bulk insert
    const leadsToInsert = leads.map((lead: any) => ({
      businessName: lead.businessName || "Unknown Business",
      contactPerson: lead.contactPerson || null,
      phone: lead.phone || "",
      phoneNormalized: normalizePhone(lead.phone || ""),
      altPhone: lead.altPhone || null,
      email: lead.email || null,
      website: lead.website || null,
      address: lead.address || null,
      city: lead.city || "Unknown",
      state: lead.state || "Unknown",
      country: lead.country || "India",
      category: lead.category || "Uncategorized",
      source: `Imported via ${source}`,
      createdById: session.user.id,
      importBatchId: batch.id,
    }));

    // Bulk create
    const createdLeads = await prisma.lead.createMany({
      data: leadsToInsert,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, count: createdLeads.count, batchId: batch.id });
  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save leads" }, { status: 500 });
  }
}
