import Link from "next/link";
import type { ReactNode } from "react";
import { PrismMark } from "@/components/studio/prism-mark";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <PrismMark className="size-7 text-lime" />
          <span className="text-xl font-semibold tracking-tight">Prism</span>
        </Link>
        <div className="rounded-2xl border border-white/10 bg-card p-6 shadow-[0_20px_60px_-24px_black]">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
