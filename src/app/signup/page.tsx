"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import type { PublicUser } from "@/lib/serialize-user";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/home";
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = (await response.json()) as { user?: PublicUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Could not create account");
      }
      setUser(payload.user);
      router.push(next.startsWith("/") ? next : "/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create an account" subtitle="Your name is saved on your profile. Credits start at zero — buy a pack when you are ready to generate.">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block space-y-1.5 text-sm">
          <span className="text-muted-foreground">Name</span>
          <Input
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 bg-white/5"
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={8}
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
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-lime hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
