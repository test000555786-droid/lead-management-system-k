import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const existing = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (existing) {
    return NextResponse.json({
      message: "Admin already exists",
      email: existing.email,
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL || "admin@company.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const name = process.env.SEED_ADMIN_NAME || "Admin User";

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashed,
      role: "ADMIN",
      active: true,
    },
  });

  return NextResponse.json({
    message: "Admin created successfully",
    email: admin.email,
    password: password,
    warning: "Change the default password immediately",
  });
}
