"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import type { PublicUser } from "@/lib/serialize-user";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/generate";
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { user?: PublicUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Could not sign in");
      }
      setUser(payload.user);
      router.push(next.startsWith("/") ? next : "/generate");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Sign in" subtitle="Pick up your jobs, credits, and generate dock.">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">Email</span>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 bg-white/5"
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">Password</span>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 bg-white/5"
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={busy}
          className="h-10 w-full rounded-lg bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <Link href="/forgot-password" className="text-lime hover:underline">
          Forgot password
        </Link>
        <p>
          New here?{" "}
          <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-lime hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
