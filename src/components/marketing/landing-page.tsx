"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { GenerateDock } from "@/components/studio/generate-dock";
import { ModelExploreGrid } from "@/components/studio/model-tool-card";
import { PrismMark } from "@/components/studio/prism-mark";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS, formatUsd } from "@/lib/credit-packs";
import { formatCredits } from "@/lib/format";
import { signupUrl } from "@/lib/paths";

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-white">
      <section className="relative isolate min-h-dvh overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/placeholders/hero-cinematic.png"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

        <MarketingNav />

        <div className="relative z-10 flex min-h-dvh flex-col px-6 pt-24 pb-44 sm:px-10 lg:px-16">
          <div className="mt-[18vh] max-w-xl">
            <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-white sm:text-5xl lg:text-[56px]">
              Image and video, many models, one dock.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
              Prism is a cheaper multi-model studio. Write a prompt, pick Flux, Seedance, Kling, or
              SDXL, and generate — stills and clips in the same place.
            </p>
            <Link
              href={signupUrl("/home")}
              className="mt-7 inline-flex h-11 items-center gap-1 rounded-lg bg-white px-5 text-sm font-semibold text-black hover:bg-white/90"
            >
              Start generating
              <ChevronRight className="size-4" />
            </Link>
          </div>
          <GenerateDock />
        </div>
      </section>

      <section id="product" className="scroll-mt-20 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm text-muted-foreground">Models</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Image and video</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            The same catalog as the studio. Open a card after you sign in to generate with that model.
          </p>
          <ModelExploreGrid guest className="mt-8" />
        </div>
      </section>

      <section className="px-6 pb-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-white/10 bg-card">
          <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:p-10">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Sign up and start generating
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Create an account, buy a credit pack when you are ready, and use the same lime dock
                you see on this page.
              </p>
            </div>
            <div className="md:justify-self-end">
              <Button
                asChild
                className="h-11 rounded-lg bg-lime px-6 font-semibold text-lime-foreground hover:bg-lime/90"
              >
                <Link href={signupUrl("/home")}>Sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1200px]">
          <p className="text-sm text-muted-foreground">Pricing</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Credit packs</h2>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Pay for what you generate. No subscription theater.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-card p-5"
              >
                <p className="text-[11px] tracking-wide text-lime uppercase">{pack.name}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {formatCredits(pack.credits)}
                </p>
                <p className="text-sm text-muted-foreground">{formatUsd(pack.amountCents)}</p>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{pack.blurb}</p>
                <Link
                  href={signupUrl("/credits")}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-white/8 text-sm font-medium text-white hover:bg-white/12"
                >
                  Get {pack.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-6 py-8 text-sm text-muted-foreground sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <span className="flex items-center gap-2 text-white">
            <PrismMark className="size-4 text-lime" />
            Prism
          </span>
          <span>Image and video studio</span>
        </div>
      </footer>
    </div>
  );
}

function MarketingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-4 border-b border-white/5 bg-black/40 px-6 py-3 backdrop-blur-md sm:px-10 lg:px-16">
      <Link href="/" className="flex items-center gap-2.5">
        <PrismMark className="size-6 text-lime" />
        <span className="text-lg font-semibold tracking-tight">Prism</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm text-white/80 sm:gap-6">
        <a href="#product" className="hover:text-white">
          Product
        </a>
        <a href="#pricing" className="hover:text-white">
          Pricing
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <Link
          href="/login?next=/home"
          className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-white/85 hover:bg-white/10 hover:text-white"
        >
          Login
        </Link>
        <Link
          href={signupUrl("/home")}
          className="inline-flex h-9 items-center rounded-lg bg-lime px-3.5 text-sm font-semibold text-lime-foreground hover:bg-lime/90"
        >
          Sign up
        </Link>
      </div>
    </header>
  );
}
