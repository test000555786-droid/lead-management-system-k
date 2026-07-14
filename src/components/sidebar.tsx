"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserCog, Upload, Menu, LogOut, Hexagon, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleSignOut } from "@/lib/actions";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SessionTracker } from "@/components/session-tracker";

export function Sidebar({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, adminOnly: false },
    { name: "Leads", href: "/leads", icon: Users, adminOnly: false },
    { name: "My Leads", href: "/my-leads", icon: UserCheck, adminOnly: false },
    { name: "Import", href: "/leads/import", icon: Upload, adminOnly: true },
    { name: "Staff", href: "/admin/staff", icon: UserCog, adminOnly: true },
  ];

  const visibleNav = navItems.filter(item => !item.adminOnly || user.role === "ADMIN");

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[var(--crm-surface)] border-r border-[var(--crm-border)] w-64 text-[var(--crm-text-primary)]">
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-[var(--crm-accent)] flex items-center justify-center text-white shrink-0">
          <Hexagon className="h-5 w-5 fill-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">Lead CRM</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {visibleNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-[var(--crm-accent-tint)] text-[var(--crm-accent)]"
                  : "text-[var(--crm-text-secondary)] hover:bg-muted hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-[var(--crm-accent)] rounded-r-full" />
              )}
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--crm-border)]">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-[var(--crm-text-secondary)] uppercase tracking-wider">{user.role}</p>
          </div>
        </div>
        <form action={handleSignOut} className="px-2">
          <Button type="submit" variant="ghost" className="w-full justify-start text-[var(--crm-text-secondary)] hover:text-foreground h-9 px-2">
            <LogOut className="h-4 w-4 mr-3" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <SessionTracker />

      {/* Mobile toggle */}
      <div className="md:hidden fixed top-2.5 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="text-[var(--crm-text-secondary)]">
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 h-screen overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </div>
    </>
  );
}
