import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.canViewAllLeads = user.canViewAllLeads;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as "ADMIN" | "STAFF";
      session.user.id = token.id as string;
      session.user.canViewAllLeads = token.canViewAllLeads as boolean;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
