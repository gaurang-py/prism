import { Suspense, type ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh min-h-[720px] overflow-hidden bg-background">
      <Suspense fallback={<aside className="w-[232px] shrink-0 bg-sidebar" />}>
        <Sidebar />
      </Suspense>
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
