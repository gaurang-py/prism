"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatCredits, formatRelative } from "@/lib/format";

interface JobRow {
  id: string;
  userEmail: string;
  userName: string;
  status: string;
  modality: string;
  modelId: string;
  prompt: string;
  creditsSpent: number;
  creditsRefunded: boolean;
  errorMessage: string | null;
  createdAt: number;
}

const STATUSES = ["all", "queued", "generating", "done", "error"] as const;

export default function AdminJobsPage() {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (q) params.set("q", q);
      const response = await fetch(`/api/admin/jobs?${params}`, { cache: "no-store" });
      const payload = (await response.json()) as { jobs?: JobRow[]; total?: number; error?: string };
      if (!response.ok) {
        toast.error(payload.error || "Could not load jobs.");
        return;
      }
      setRows(payload.jobs ?? []);
      setTotal(payload.total ?? 0);
    })();
  }, [q, status]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={`rounded-xl px-3 py-2 text-sm capitalize ${
              status === item ? "bg-lime text-lime-foreground" : "bg-white/5 text-muted-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search prompt, model, or email…"
        className="mt-4 h-10 w-full max-w-md rounded-xl border border-white/10 bg-card px-3 text-sm outline-none focus:border-lime/50"
      />

      <p className="mt-4 text-sm text-muted-foreground">{formatCredits(total)} jobs</p>

      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-white/10 bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{row.status}</Badge>
              <Badge variant="outline">{row.modality}</Badge>
              <span className="text-muted-foreground">{row.modelId}</span>
              <span className="ml-auto tabular-nums text-lime">{formatCredits(row.creditsSpent)} cr</span>
            </div>
            <p className="mt-2 font-medium">{row.prompt}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.userName} · {row.userEmail} · {formatRelative(row.createdAt)}
            </p>
            {row.errorMessage ? (
              <p className="mt-2 text-xs text-destructive">{row.errorMessage}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
