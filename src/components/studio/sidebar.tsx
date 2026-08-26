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
import { useStudio } from "@/context/studio-context";
import { formatCredits } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home, id: "home" },
  { href: "/generate?mode=image", label: "Image", icon: ImageIcon, id: "image" },
  { href: "/generate?mode=video", label: "Video", icon: Clapperboard, id: "video" },
  { href: "/history", label: "History", icon: History, id: "history" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { credits, creditError, resetDemo } = useStudio();
  const mode = searchParams.get("mode");

  function isActive(id: string) {
    if (id === "home") return pathname === "/";
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
        <Link href="/" className="flex items-center gap-2.5">
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
        <div
          className={cn(
            "flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm",
            creditError && "credit-error text-destructive",
          )}
        >
          <span className="text-muted-foreground">Credits</span>
          <span className="font-medium tabular-nums text-lime">
            {formatCredits(credits)}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-2 rounded-xl bg-white/5 px-2 py-2 hover:bg-white/8"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-lime/20 text-xs font-semibold text-lime">
                AC
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-medium">Avery Chen</span>
                <span className="block text-[11px] text-muted-foreground">Demo seat</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm">Avery Chen</div>
              <div className="text-xs text-muted-foreground">avery@prism.studio</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Auth is mocked</DropdownMenuItem>
            <DropdownMenuItem onClick={resetDemo}>Reset demo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export function PrismMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} fill="none" aria-hidden>
      <path
        d="M12 2.5 21 19.5H3L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 2.5 8 19.5" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
      <path d="M12 2.5 16 19.5" stroke="currentColor" strokeWidth="1.1" opacity="0.35" />
    </svg>
  );
}
