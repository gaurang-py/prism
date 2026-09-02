"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatTimestamp } from "@/lib/format";

interface AdminRow {
  id: string;
  email: string;
  name: string;
  createdAt: number;
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/admins", { cache: "no-store" });
    const payload = (await response.json()) as { admins?: AdminRow[]; error?: string };
    if (!response.ok) throw new Error(payload.error || "Could not load admins.");
    setAdmins(payload.admins ?? []);
  }, []);

  useEffect(() => {
    void load().catch((error) => toast.error(error instanceof Error ? error.message : "Load failed"));
  }, [load]);

  async function addAdmin() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not add admin.");
      toast.success("Admin added");
      setEmail("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeAdmin(targetEmail: string) {
    const response = await fetch(`/api/admin/admins?email=${encodeURIComponent(targetEmail)}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      toast.error(payload.error || "Could not remove admin.");
      return;
    }
    toast.success("Admin removed");
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <p className="text-sm text-muted-foreground">
        Admins can manage users, credits, sales, and promote other admins.
      </p>

      <div className="mt-6 flex gap-2">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="user@company.com"
        />
        <Button
          type="button"
          disabled={busy || !email.trim()}
          onClick={() => void addAdmin()}
          className="shrink-0 bg-lime text-lime-foreground hover:bg-lime/90"
        >
          Add admin
        </Button>
      </div>

      <ul className="mt-8 space-y-2">
        {admins.map((admin) => (
          <li
            key={admin.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-card px-4 py-3"
          >
            <div>
              <p className="font-medium">{admin.name}</p>
              <p className="text-sm text-muted-foreground">{admin.email}</p>
              <p className="text-xs text-muted-foreground">Since {formatTimestamp(admin.createdAt)}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void removeAdmin(admin.email)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
