"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StudioProvider } from "@/context/studio-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
    >
      <TooltipProvider delayDuration={200}>
        <StudioProvider>
          {children}
          <Toaster position="bottom-right" theme="dark" />
        </StudioProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
