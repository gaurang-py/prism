"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import type { PublicUser } from "@/lib/serialize-user";
import { cn } from "@/lib/utils";

export function NsfwToggle({ className }: { className?: string }) {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function persist(next: { nsfwEnabled: boolean; nsfwAgeConfirmed?: boolean }) {
    setBusy(true);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const payload = (await response.json()) as { user?: PublicUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Could not update NSFW setting");
      }
      setUser(payload.user);
      toast.success(payload.user.nsfwEnabled ? "NSFW models are on" : "NSFW models hidden");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update NSFW setting");
    } finally {
      setBusy(false);
    }
  }

  function onToggle() {
    if (!user) return;
    if (user.nsfwEnabled) {
      void persist({ nsfwEnabled: false });
      return;
    }
    if (user.nsfwAgeConfirmed) {
      void persist({ nsfwEnabled: true });
      return;
    }
    setConfirmed(false);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        disabled={busy}
        className={cn(
          "inline-flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold tracking-wide uppercase",
          user.nsfwEnabled ? "bg-lime text-lime-foreground" : "bg-white/8 text-white/70 hover:bg-white/12",
          className,
        )}
      >
        NSFW {user.nsfwEnabled ? "on" : "off"}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card sm:max-w-md" overlayClassName="bg-black/70">
          <DialogHeader>
            <DialogTitle>Adult content</DialogTitle>
            <DialogDescription>
              NSFW models are for consenting adults. They map to Fal endpoints with the safety
              checker off. Child sexual content, anyone 17 or under, and non-consensual imagery
              are banned. Turning this on only reveals those models — it does not send adult
              prompts through SFW endpoints.
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[#dfff00]"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>I confirm I am 18 or older and only want adult NSFW.</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!confirmed || busy}
              className="bg-lime font-semibold text-lime-foreground hover:bg-lime/90"
              onClick={() => {
                setOpen(false);
                void persist({ nsfwEnabled: true, nsfwAgeConfirmed: true });
              }}
            >
              Turn NSFW on
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
