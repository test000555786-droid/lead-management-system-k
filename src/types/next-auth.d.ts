import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      canViewAllLeads: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    role: Role;
    canViewAllLeads: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    id: string;
    canViewAllLeads: boolean;
  }
}
