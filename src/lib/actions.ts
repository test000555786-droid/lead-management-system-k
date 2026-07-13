"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/lib/auth";

export async function handleSignOut() {
  await signOut();
}
import { Role, LeadStatus, Prisma } from "@prisma/client";
import { normalizePhone, normalizeLocation } from "@/lib/utils";

// ─── STAFF MANAGEMENT ──────────────────────────

const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "STAFF"]),
});

export async function createStaff(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as string,
  };

  const parsed = createStaffSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: hashed,
      role: parsed.data.role as Role,
      active: true,
    },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function toggleStaffActive(userId: string, active: boolean) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (userId === session.user.id) {
    throw new Error("You cannot deactivate your own account");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { active },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function getStaffList() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const staff = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { leadsAssigned: true },
      },
    },
  });

  return staff;
}

export async function getActiveStaff() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const staff = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  return staff;
}

// ─── LEAD CRUD ─────────────────────────────────

const createLeadSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  altPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  notes: z.string().optional(),
});

export async function createLead(data: z.infer<typeof createLeadSchema>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = createLeadSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const normalizedPhone = normalizePhone(parsed.data.phone);

  const existing = await prisma.lead.findFirst({
    where: { phoneNormalized: normalizedPhone },
  });
  if (existing) {
    throw new Error(`A lead with this phone number already exists: ${existing.businessName}`);
  }

  const lead = await prisma.lead.create({
    data: {
      businessName: parsed.data.businessName.trim(),
      contactPerson: parsed.data.contactPerson?.trim() || null,
      phone: parsed.data.phone.trim(),
      phoneNormalized: normalizedPhone,
      altPhone: parsed.data.altPhone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      website: parsed.data.website?.trim() || null,
      address: parsed.data.address?.trim() || null,
      city: normalizeLocation(parsed.data.city),
      state: normalizeLocation(parsed.data.state),
      country: normalizeLocation(parsed.data.country || "India"),
      category: parsed.data.category.trim(),
      notes: parsed.data.notes?.trim() || null,
      createdById: session.user.id,
      status: "NEW",
    },
  });

  await prisma.activityLog.create({
    data: {
      leadId: lead.id,
      userId: session.user.id,
      action: "note_added",
      detail: "Lead created manually",
    },
  });

  revalidatePath("/leads");
  return lead;
}

export async function getLeads(params: {
  city?: string;
  state?: string;
  country?: string;
  category?: string;
  status?: string;
  assignedTo?: string;
  search?: string;
  from?: string;
  to?: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const andConditions: Prisma.LeadWhereInput[] = [];

  if (session.user.role === "STAFF") {
    andConditions.push({
      OR: [
        { assignedToId: session.user.id },
        { assignedToId: null },
      ],
    });
  }

  if (params.city) {
    andConditions.push({ city: { contains: params.city, mode: "insensitive" } });
  }
  if (params.state) {
    andConditions.push({ state: { contains: params.state, mode: "insensitive" } });
  }
  if (params.country) {
    andConditions.push({ country: { contains: params.country, mode: "insensitive" } });
  }
  if (params.category) {
    andConditions.push({ category: { contains: params.category, mode: "insensitive" } });
  }
  if (params.status) {
    andConditions.push({ status: params.status as LeadStatus });
  }
  if (params.assignedTo) {
    if (params.assignedTo === "null" || params.assignedTo === "unassigned") {
      andConditions.push({ assignedToId: null });
    } else {
      andConditions.push({ assignedToId: params.assignedTo });
    }
  }

  if (params.from || params.to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (params.from) dateFilter.gte = new Date(params.from);
    if (params.to) dateFilter.lte = new Date(params.to);
    andConditions.push({ createdAt: dateFilter });
  }

  if (params.search) {
    andConditions.push({
      OR: [
        { businessName: { contains: params.search, mode: "insensitive" } },
        { phone: { contains: params.search, mode: "insensitive" } },
        { contactPerson: { contains: params.search, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.LeadWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { followUps: true } },
      followUps: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, notes: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return leads;
}

export async function getLeadById(leadId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      assignedTo: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      followUps: {
        include: { staff: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activityLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      denyReason: true,
      importBatch: { select: { source: true, fileName: true } },
    },
  });

  if (!lead) throw new Error("Lead not found");

  if (session.user.role === "STAFF") {
    if (lead.assignedToId && lead.assignedToId !== session.user.id) {
      throw new Error("Unauthorized");
    }
  }

  return lead;
}

export async function getFilterOptions() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const [cities, states, countries, categories] = await Promise.all([
    prisma.lead.findMany({ distinct: ["city"], select: { city: true }, orderBy: { city: "asc" } }),
    prisma.lead.findMany({ distinct: ["state"], select: { state: true }, orderBy: { state: "asc" } }),
    prisma.lead.findMany({ distinct: ["country"], select: { country: true }, orderBy: { country: "asc" } }),
    prisma.lead.findMany({ distinct: ["category"], select: { category: true }, orderBy: { category: "asc" } }),
  ]);

  return {
    cities: cities.map((c) => c.city),
    states: states.map((s) => s.state),
    countries: countries.map((c) => c.country),
    categories: categories.map((c) => c.category),
  };
}

// ─── STATUS PIPELINE ───────────────────────────

const statusChangeSchema = z.object({
  leadId: z.string(),
  status: z.enum(["NEW", "CONTACTED", "FOLLOW_UP", "INTERESTED", "CONVERTED", "NOT_INTERESTED"]),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  denyCategory: z.string().optional(),
  denyDetails: z.string().optional(),
});

export async function updateLeadStatus(data: z.infer<typeof statusChangeSchema>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const parsed = statusChangeSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const { leadId, status, notes, nextFollowUpAt, denyCategory, denyDetails } = parsed.data;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { assignedToId: true, status: true },
  });
  if (!lead) throw new Error("Lead not found");

  if (session.user.role === "STAFF" && lead.assignedToId && lead.assignedToId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  // ENFORCE: NOT_INTERESTED requires deny reason
  if (status === "NOT_INTERESTED" && !denyCategory) {
    throw new Error("Deny reason category is required when marking as Not Interested");
  }

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { status: status as LeadStatus },
    });

    if (status === "FOLLOW_UP" && notes) {
      await tx.followUp.create({
        data: {
          leadId,
          staffId: session.user.id,
          notes,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
          outcome: notes,
        },
      });
    }

    if (status === "NOT_INTERESTED" && denyCategory) {
      await tx.denyReason.create({
        data: {
          leadId,
          category: denyCategory,
          details: denyDetails || null,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        action: "status_changed",
        detail: `Status changed from ${lead.status} to ${status}${notes ? ". Notes: " + notes : ""}`,
      },
    });
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { success: true };
}

export async function assignLead(leadId: string, assignedToId: string | null) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { assignedToId: true },
  });
  if (!lead) throw new Error("Lead not found");

  if (session.user.role === "STAFF") {
    if (lead.assignedToId !== null) {
      throw new Error("This lead is already assigned");
    }
    if (assignedToId !== session.user.id) {
      throw new Error("You can only claim leads for yourself");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { assignedToId },
    });

    await tx.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        action: "assigned",
        detail: assignedToId ? "Assigned to staff member" : "Unassigned",
      },
    });
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { success: true };
}

export async function addFollowUp(leadId: string, notes: string, nextFollowUpAt?: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { assignedToId: true },
  });
  if (!lead) throw new Error("Lead not found");

  if (session.user.role === "STAFF" && lead.assignedToId && lead.assignedToId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.$transaction(async (tx) => {
    await tx.followUp.create({
      data: {
        leadId,
        staffId: session.user.id,
        notes,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
      },
    });

    await tx.activityLog.create({
      data: {
        leadId,
        userId: session.user.id,
        action: "note_added",
        detail: `Follow-up added: ${notes}`,
      },
    });
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return { success: true };
}

// ─── DASHBOARD STATS ───────────────────────────

export async function getDashboardStats() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const baseWhere: Prisma.LeadWhereInput =
    session.user.role === "STAFF"
      ? { OR: [{ assignedToId: session.user.id }, { assignedToId: null }] }
      : {};

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalLeads, newThisWeek, convertedLeads, followUpsDue] = await Promise.all([
    prisma.lead.count({ where: baseWhere }),
    prisma.lead.count({ where: { ...baseWhere, createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { ...baseWhere, status: "CONVERTED" } }),
    prisma.followUp.count({
      where: {
        nextFollowUpAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        lead: baseWhere,
      },
    }),
  ]);

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  return { totalLeads, newThisWeek, convertedLeads, conversionRate, followUpsDue };
}

export async function getFunnelData() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const baseWhere: Prisma.LeadWhereInput =
    session.user.role === "STAFF"
      ? { OR: [{ assignedToId: session.user.id }, { assignedToId: null }] }
      : {};

  const statuses = ["NEW", "CONTACTED", "INTERESTED", "CONVERTED"] as const;
  const counts = await Promise.all(
    statuses.map((status) => prisma.lead.count({ where: { ...baseWhere, status } }))
  );

  return statuses.map((status, i) => ({
    name: status.replace("_", " "),
    count: counts[i],
    status,
  }));
}

export async function getStaffLeaderboard() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const staff = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      role: true,
      _count: {
        select: {
          leadsAssigned: true,
          followUps: true,
        },
      },
      leadsAssigned: {
        where: { status: "CONVERTED" },
        select: { id: true },
      },
      followUps: {
        where: {
          nextFollowUpAt: {
            gte: new Date(),
          },
        },
        select: { id: true },
      },
    },
  });

  return staff.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    totalAssigned: s._count.leadsAssigned,
    conversions: s.leadsAssigned.length,
    followUpsLogged: s._count.followUps,
    pendingFollowUps: s.followUps.length,
  }));
}

export async function getFollowUpsDueToday() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const baseWhere: Prisma.LeadWhereInput =
    session.user.role === "STAFF"
      ? { OR: [{ assignedToId: session.user.id }, { assignedToId: null }] }
      : {};

  const followUps = await prisma.followUp.findMany({
    where: {
      nextFollowUpAt: { gte: todayStart, lt: todayEnd },
      lead: baseWhere,
    },
    include: {
      lead: {
        select: {
          id: true,
          businessName: true,
          phone: true,
          city: true,
          status: true,
        },
      },
      staff: { select: { name: true } },
    },
    orderBy: { nextFollowUpAt: "asc" },
  });

  return followUps;
}

// ─── FORM ACTION WRAPPERS ──────────────────────

export async function assignLeadFormAction(formData: FormData): Promise<void> {
  const leadId = formData.get("leadId") as string;
  const assignedToId = formData.get("assignedToId") as string;
  await assignLead(leadId, assignedToId === "unassigned" ? null : assignedToId);
}

export async function claimLeadFormAction(formData: FormData): Promise<void> {
  const leadId = formData.get("leadId") as string;
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  await assignLead(leadId, session.user.id);
}
