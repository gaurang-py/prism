"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { CREDIT_PACKS, formatUsd } from "@/lib/credit-packs";
import { formatCredits } from "@/lib/format";

interface Purchase {
  id: string;
  packId: string;
  credits: number;
  amountCents: number;
  createdAt: number;
}

export default function CreditsPage() {
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const checkout = searchParams.get("checkout");
  const [noted, setNoted] = useState("");

  useEffect(() => {
    if (checkout && checkout !== noted) {
      setNoted(checkout);
      if (checkout === "success") {
        toast.success("Payment received", {
          description: "Credits appear after the Stripe webhook lands. Refresh if the balance is still catching up.",
        });
        void refreshUser();
      }
      if (checkout === "cancel") {
        toast.message("Checkout canceled");
      }
    }
  }, [checkout, noted, refreshUser]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/credits", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { purchases?: Purchase[] };
      setPurchases(payload.purchases ?? []);
    })();
  }, [user?.credits]);

  async function buy(packId: string) {
    setBusyId(packId);
    try {
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Could not start Checkout");
      }
      window.location.href = payload.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start Checkout");
      setBusyId(null);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <div className="mx-auto max-w-3xl px-8 py-10">
        <p className="text-sm text-muted-foreground">Billing</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Credits</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Balance{" "}
          <span className="font-medium tabular-nums text-lime">
            {formatCredits(user?.credits ?? 0)}
          </span>
          . Packs are charged in Stripe test or live mode — nothing is mocked.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-card p-4"
            >
              <p className="text-[11px] tracking-wide text-lime uppercase">{pack.name}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatCredits(pack.credits)}
              </p>
              <p className="text-sm text-muted-foreground">{formatUsd(pack.amountCents)}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{pack.blurb}</p>
              <Button
                type="button"
                onClick={() => void buy(pack.id)}
                disabled={busyId !== null}
                className="mt-4 h-10 rounded-lg bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
              >
                {busyId === pack.id ? "Redirecting…" : "Buy with Stripe"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <h2 className="text-sm font-medium">Recent purchases</h2>
          {purchases.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {purchases.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
                >
                  <span className="capitalize">{row.packId}</span>
                  <span className="tabular-nums text-lime">+{formatCredits(row.credits)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
