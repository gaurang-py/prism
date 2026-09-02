"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/admin");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/home");
    }
  }, [loading, router, user]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-full items-center justify-center bg-canvas text-sm text-muted-foreground">
        Checking admin access…
      </div>
    );
  }

  return <>{children}</>;
}
