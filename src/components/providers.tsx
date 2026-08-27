"use client";

import { ThemeProvider } from "next-themes";
import { Suspense, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { StudioProvider } from "@/context/studio-context";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
    >
      <TooltipProvider delayDuration={200}>
        <Suspense>
          <AuthProvider>
            <StudioProvider>
              {children}
              <Toaster position="bottom-right" theme="dark" />
            </StudioProvider>
          </AuthProvider>
        </Suspense>
      </TooltipProvider>
    </ThemeProvider>
  );
}
