"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Could not start a reset");
      }
      setMessage(
        payload.message ||
          "If that email is on file, we sent a reset link. In local dev without mail keys, the URL is printed in the server console.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a reset");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We email a one-hour reset link. Without a mail key, the link is logged on the server."
    >
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
        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-lime">{message}</p>}
        <Button
          type="submit"
          disabled={busy}
          className="h-10 w-full rounded-lg bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
        >
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/login" className="text-lime hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
