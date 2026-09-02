"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/credit-packs";
import { formatCredits, formatRelative, formatTimestamp } from "@/lib/format";

interface Stats {
  users: number;
  admins: number;
  creditsInCirculation: number;
  revenueCents: number;
  creditsSold: number;
  purchasesWeek: number;
  jobsToday: number;
  jobsWeek: number;
  signupsWeek: number;
  recentPurchases: Array<{
    id: string;
    packId: string;
    credits: number;
    amountCents: number;
    createdAt: number;
    userEmail: string;
    userName: string;
  }>;
  recentAdjustments: Array<{
    id: string;
    delta: number;
    balanceAfter: number;
    reason: string;
    createdAt: number;
    userEmail: string;
    adminEmail: string;
  }>;
  recentSignups: Array<{
    id: string;
    email: string;
    name: string;
    credits: number;
    role: string;
    createdAt: number;
  }>;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/stats", { cache: "no-store" });
      const payload = (await response.json()) as Stats & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Could not load stats.");
        return;
      }
      setStats(payload);
    })();
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-10 text-sm text-destructive">{error}</div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-10 text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={formatCredits(stats.users)} hint={`${stats.signupsWeek} joined this week`} />
        <StatCard label="Revenue" value={formatUsd(stats.revenueCents)} hint={`${formatCredits(stats.creditsSold)} credits sold`} />
        <StatCard label="Credits in circulation" value={formatCredits(stats.creditsInCirculation)} />
        <StatCard label="Generations (24h)" value={formatCredits(stats.jobsToday)} hint={`${formatCredits(stats.jobsWeek)} this week`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-card p-4">
          <h2 className="text-sm font-medium">Recent sales</h2>
          <ul className="mt-3 space-y-2">
            {stats.recentPurchases.length === 0 ? (
              <li className="text-sm text-muted-foreground">No purchases yet.</li>
            ) : (
              stats.recentPurchases.map((row) => (
                <li key={row.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium capitalize">{row.packId}</p>
                    <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="tabular-nums text-lime">+{formatCredits(row.credits)}</p>
                    <p className="text-xs text-muted-foreground">{formatRelative(row.createdAt)}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card p-4">
          <h2 className="text-sm font-medium">Recent credit adjustments</h2>
          <ul className="mt-3 space-y-2">
            {stats.recentAdjustments.length === 0 ? (
              <li className="text-sm text-muted-foreground">No manual adjustments yet.</li>
            ) : (
              stats.recentAdjustments.map((row) => (
                <li key={row.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{row.userEmail}</span>
                    <span className={row.delta >= 0 ? "text-lime" : "text-destructive"}>
                      {row.delta >= 0 ? "+" : ""}
                      {formatCredits(row.delta)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    by {row.adminEmail} · {row.reason || "Manual adjustment"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-card p-4 lg:col-span-2">
          <h2 className="text-sm font-medium">Recent signups</h2>
          <ul className="mt-3 space-y-2">
            {stats.recentSignups.map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums">{formatCredits(row.credits)} credits</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(row.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
