"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Clapperboard, History, Home, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useStudio } from "@/context/studio-context";
import { formatCredits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PrismMark } from "./prism-mark";

const NAV = [
  { href: "/home", label: "Home", icon: Home, id: "home" },
  { href: "/generate?mode=image", label: "Image", icon: ImageIcon, id: "image" },
  { href: "/generate?mode=video", label: "Video", icon: Clapperboard, id: "video" },
  { href: "/history", label: "History", icon: History, id: "history" },
] as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { credits, creditError } = useStudio();
  const { user, logout } = useAuth();
  const mode = searchParams.get("mode");
  const balance = user?.credits ?? credits;

  function isActive(id: string) {
    if (id === "home") return pathname === "/home";
    if (id === "history") return pathname === "/history" || pathname === "/library";
    if (id === "image") {
      return (
        pathname === "/image" ||
        (pathname === "/generate" && (mode === "image" || !mode))
      );
    }
    if (id === "video") {
      return pathname === "/video" || (pathname === "/generate" && mode === "video");
    }
    return false;
  }

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-4 pt-5 pb-4">
        <Link href="/home" className="flex items-center gap-2.5">
          <PrismMark className="size-6 text-lime" />
          <span className="text-lg font-semibold tracking-tight">Prism</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map((item) => {
          const active = isActive(item.id);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/8 text-white"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 p-3">
        <Link
          href={user ? "/credits" : "/login?next=/credits"}
          className={cn(
            "flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm hover:bg-white/8",
            creditError && "credit-error text-destructive",
          )}
        >
          <span className="text-muted-foreground">Credits</span>
          <span className="font-medium tabular-nums text-lime">
            {formatCredits(balance)}
          </span>
        </Link>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-2 rounded-xl bg-white/5 px-2 py-2 hover:bg-white/8"
              >
                <UserAvatar name={user.name} url={user.avatarUrl} />
                <span className="min-w-0 text-left">
                  <span className="block truncate text-sm font-medium">{user.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {user.email}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/credits">Buy credits</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => void logout()}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login?next=/home"
            className="flex h-10 items-center justify-center rounded-xl bg-lime text-sm font-semibold text-lime-foreground hover:bg-lime/90"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}

function UserAvatar({ name, url }: { name: string; url: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className="size-8 rounded-full object-cover" />
    );
  }
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-lime/20 text-xs font-semibold text-lime">
      {initials(name)}
    </span>
  );
}

export { PrismMark };
