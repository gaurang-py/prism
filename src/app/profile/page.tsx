"use client";

/* eslint-disable @next/next/no-img-element -- avatar preview is a signed R2 URL */

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import type { PublicUser } from "@/lib/serialize-user";

export default function ProfilePage() {
  const { user, setUser, loading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatar, setAvatar] = useState(user?.avatarUrl ?? "");
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (user && hydratedFor !== user.id) {
    setHydratedFor(user.id);
    setName(user.name);
    setBio(user.bio);
    setAvatar(user.avatarUrl);
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      const payload = (await response.json()) as { user?: PublicUser; error?: string };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Could not save profile");
      }
      setUser(payload.user);
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  async function onAvatar(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/me/avatar", { method: "POST", body });
      const payload = (await response.json()) as {
        user?: PublicUser;
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.user) {
        throw new Error(payload.error || "Avatar upload failed");
      }
      setUser(payload.user);
      setAvatar(payload.url || payload.user.avatarUrl);
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (loading && !user) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading profile…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <div className="mx-auto max-w-xl px-8 py-10">
        <p className="text-sm text-muted-foreground">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Name and avatar are stored on your user. Avatars live under <code>avatars/</code> in R2
          and are not purged with 7-day generations.
        </p>

        <form onSubmit={onSave} className="mt-8 space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative size-16 overflow-hidden rounded-full border border-white/10 bg-white/5"
              aria-label="Change avatar"
            >
              {avatar ? (
                <img src={avatar} alt="" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-sm font-semibold text-lime">
                  {(name || "?").slice(0, 2).toUpperCase()}
                </span>
              )}
            </button>
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1 text-sm text-lime hover:underline"
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Change avatar"}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onAvatar(file);
                event.target.value = "";
              }}
            />
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="text-muted-foreground">Name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 bg-white/5"
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="text-muted-foreground">Bio</span>
            <Textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={280}
              placeholder="A line about how you generate."
              className="min-h-24 bg-white/5"
            />
          </label>
          <Button
            type="submit"
            disabled={busy}
            className="h-10 rounded-lg bg-lime px-5 font-semibold text-lime-foreground hover:bg-lime/90"
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </form>
      </div>
    </div>
  );
}
