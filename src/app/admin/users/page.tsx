"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCredits, formatTimestamp } from "@/lib/format";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  credits: number;
  role: "user" | "admin";
  createdAt: number;
  jobCount: number;
  purchaseCount: number;
  sessionCount: number;
}

interface UserDetail extends AdminUser {
  bio: string;
  nsfwEnabled: boolean;
  purchases: Array<{ id: string; packId: string; credits: number; amountCents: number; createdAt: number }>;
  adjustments: Array<{ id: string; delta: number; balanceAfter: number; reason: string; createdAt: number; adminEmail: string }>;
  jobs: Array<{ id: string; status: string; modality: string; modelId: string; creditsSpent: number; createdAt: number }>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [delta, setDelta] = useState("");
  const [credits, setCredits] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(async (search = query) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const response = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
    const payload = (await response.json()) as { users?: AdminUser[]; total?: number; error?: string };
    if (!response.ok) throw new Error(payload.error || "Could not load users.");
    setUsers(payload.users ?? []);
    setTotal(payload.total ?? 0);
  }, [query]);

  useEffect(() => {
    void loadUsers().catch((error) => toast.error(error instanceof Error ? error.message : "Load failed"));
  }, [loadUsers]);

  async function openUser(id: string) {
    const response = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });
    const payload = (await response.json()) as { user?: UserDetail; error?: string };
    if (!response.ok || !payload.user) {
      toast.error(payload.error || "Could not load user.");
      return;
    }
    setSelected(payload.user);
    setDelta("");
    setCredits(String(payload.user.credits));
    setReason("");
  }

  async function applyChanges() {
    if (!selected) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = { reason };
      if (delta.trim()) {
        body.delta = Number(delta);
      } else if (credits.trim()) {
        body.credits = Number(credits);
      }
      const response = await fetch(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { user?: AdminUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Could not update user.");
      }
      toast.success("User updated");
      setSelected(null);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleRole(user: AdminUser) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole, reason: `Role changed to ${nextRole}` }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      toast.error(payload.error || "Could not change role.");
      return;
    }
    toast.success(nextRole === "admin" ? "Promoted to admin" : "Demoted to user");
    await loadUsers();
    if (selected?.id === user.id) await openUser(user.id);
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <label className="text-sm text-muted-foreground">Search users</label>
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Email or name"
            className="mt-1"
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            setQuery(q);
            void loadUsers(q);
          }}
          className="bg-lime text-lime-foreground hover:bg-lime/90"
        >
          Search
        </Button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{formatCredits(total)} users</p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Activity</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-white/10">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-lime">{formatCredits(user.credits)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.jobCount} jobs · {user.purchaseCount} purchases
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => void openUser(user.id)}>
                      Manage
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void toggleRole(user)}>
                      {user.role === "admin" ? "Demote" : "Make admin"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm text-muted-foreground">Add / remove credits</label>
                  <Input
                    value={delta}
                    onChange={(event) => setDelta(event.target.value)}
                    placeholder="e.g. 500 or -100"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Set exact balance</label>
                  <Input
                    value={credits}
                    onChange={(event) => setCredits(event.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Reason</label>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Support grant, refund, promo…"
                  className="mt-1 min-h-20"
                />
              </div>

              <div className="rounded-xl bg-white/5 p-3 text-sm">
                <p className="font-medium">Recent adjustments</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {selected.adjustments.length === 0 ? (
                    <li>None yet.</li>
                  ) : (
                    selected.adjustments.slice(0, 5).map((row) => (
                      <li key={row.id}>
                        {row.delta >= 0 ? "+" : ""}
                        {formatCredits(row.delta)} by {row.adminEmail}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void applyChanges()}
                  className="bg-lime text-lime-foreground hover:bg-lime/90"
                >
                  {busy ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
