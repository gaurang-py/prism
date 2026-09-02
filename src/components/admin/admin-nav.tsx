"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, Shield, ShoppingBag, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/sales", label: "Sales", icon: ShoppingBag, exact: false },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase, exact: false },
  { href: "/admin/admins", label: "Admins", icon: Shield, exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-white/10 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-8 py-4">
        <div className="mr-4">
          <p className="text-[11px] tracking-wide text-lime uppercase">Admin</p>
          <h1 className="text-lg font-semibold tracking-tight">Control panel</h1>
        </div>
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-lime text-lime-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
