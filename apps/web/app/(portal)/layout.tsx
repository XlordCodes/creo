"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  FileImage,
  Calendar,
  CreditCard,
  LifeBuoy,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
}

const PORTAL_NAV: PortalNavItem[] = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Deliverables", href: "/portal/deliverables", icon: FileImage },
  { label: "Calendar", href: "/portal/calendar", icon: Calendar },
  { label: "Payments", href: "/portal/payments", icon: CreditCard },
  { label: "Support", href: "/portal/support", icon: LifeBuoy },
];

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-white">
      <div className="flex h-16 items-center gap-2 px-5 text-lg font-bold">
        <span className="text-[var(--color-brand)]">Creo</span>
        <span className="text-xs font-medium text-muted-foreground">Portal</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {PORTAL_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/portal"
              ? pathname === "/portal"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-brand-light)] text-[var(--color-brand)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-white md:hidden">
      {PORTAL_NAV.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
              isActive
                ? "text-[var(--color-brand)]"
                : "text-muted-foreground"
            )}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
