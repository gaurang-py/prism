"use client";

import { Coins } from "lucide-react";
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
import { PrismMark } from "./sidebar";

export function TopBar() {
  const { credits, creditError, resetDemo } = useStudio();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/80 px-5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <PrismMark className="size-5" />
        <span className="font-display text-[1.65rem] leading-none tracking-tight text-foreground italic">
          Prism
        </span>
        <span className="ml-1 hidden rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[10px] tracking-[0.16em] text-gold uppercase sm:inline">
          Studio
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border border-gold/20 bg-gold/8 px-3 py-1.5 text-sm text-gold",
            creditError && "credit-error border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          <Coins className="size-3.5" strokeWidth={1.75} />
          <span className="tabular-nums tracking-wide">{formatCredits(credits)}</span>
          <span className="hidden text-[11px] tracking-[0.12em] text-current/70 uppercase sm:inline">
            credits
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 rounded-full border border-border/80 bg-card/60 pl-1 pr-3"
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-gold/15 font-medium text-gold">
                AC
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-xs font-medium text-foreground">Avery Chen</span>
                <span className="block text-[10px] tracking-wide text-muted-foreground uppercase">
                  Demo seat
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
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
    </header>
  );
}
