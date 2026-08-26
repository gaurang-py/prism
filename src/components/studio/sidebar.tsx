"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Images, Sparkles, StretchHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Generate", icon: Sparkles, match: (path: string) => path === "/" },
  {
    href: "/image",
    label: "Image",
    icon: StretchHorizontal,
    match: (path: string) => path === "/image",
  },
  {
    href: "/video",
    label: "Video",
    icon: Clapperboard,
    match: (path: string) => path === "/video",
  },
  {
    href: "/library",
    label: "Library",
    icon: Images,
    match: (path: string) => path === "/library",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[84px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center justify-center border-b border-sidebar-border">
        <Link href="/" className="group flex size-9 items-center justify-center" aria-label="Prism home">
          <PrismMark />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-4">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors",
                active
                  ? "bg-sidebar-accent text-gold"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute top-2 bottom-2 left-0 w-[2px] rounded-full bg-gold" />
              )}
              <Icon className="size-[18px]" strokeWidth={1.6} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="px-2 pb-4 text-center text-[9px] tracking-[0.18em] text-muted-foreground/70 uppercase">
        Mock
      </p>
    </aside>
  );
}

export function PrismMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 text-gold transition-transform group-hover:rotate-12", className)}
      fill="none"
      aria-hidden
    >
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
