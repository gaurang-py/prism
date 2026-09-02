"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatUsd } from "@/lib/credit-packs";
import { formatCredits, formatTimestamp } from "@/lib/format";

interface PurchaseRow {
  id: string;
  userEmail: string;
  userName: string;
  packId: string;
  credits: number;
  amountCents: number;
  stripeSessionId: string;
  createdAt: number;
}

export default function AdminSalesPage() {
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [revenueCents, setRevenueCents] = useState(0);
  const [creditsSold, setCreditsSold] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const response = await fetch(`/api/admin/purchases?${params}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        purchases?: PurchaseRow[];
        total?: number;
        revenueCents?: number;
        creditsSold?: number;
        error?: string;
      };
      if (!response.ok) {
        toast.error(payload.error || "Could not load sales.");
        return;
      }
      setRows(payload.purchases ?? []);
      setTotal(payload.total ?? 0);
      setRevenueCents(payload.revenueCents ?? 0);
      setCreditsSold(payload.creditsSold ?? 0);
    })();
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-card p-4">
          <p className="text-sm text-muted-foreground">Total revenue</p>
          <p className="mt-2 text-2xl font-semibold">{formatUsd(revenueCents)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-4">
          <p className="text-sm text-muted-foreground">Credits sold</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-lime">{formatCredits(creditsSold)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card p-4">
          <p className="text-sm text-muted-foreground">Orders</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatCredits(total)}</p>
        </div>
      </div>

      <div className="mt-8">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Filter by email, name, or pack…"
          className="h-10 w-full max-w-md rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-lime/50"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Pack</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.userName}</p>
                  <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                </td>
                <td className="px-4 py-3 capitalize">{row.packId}</td>
                <td className="px-4 py-3 tabular-nums text-lime">+{formatCredits(row.credits)}</td>
                <td className="px-4 py-3 tabular-nums">{formatUsd(row.amountCents)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
