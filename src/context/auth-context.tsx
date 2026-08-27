"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PublicUser } from "@/lib/serialize-user";
import { isAuthPath } from "@/lib/paths";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  refreshUser: () => Promise<PublicUser | null>;
  logout: () => Promise<void>;
  setUser: Dispatch<SetStateAction<PublicUser | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const payload = (await response.json()) as { user?: PublicUser | null };
      const next = payload.user ?? null;
      setUser(next);
      return next;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser, pathname]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    toast.success("Signed out");
    if (!isAuthPath(pathname) && pathname !== "/") {
      router.push("/");
    }
    router.refresh();
  }, [pathname, router]);

  const value = useMemo(
    () => ({ user, loading, refreshUser, logout, setUser }),
    [user, loading, refreshUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
