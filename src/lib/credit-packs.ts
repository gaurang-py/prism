export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  amountCents: number;
  blurb: string;
  priceEnv: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 200,
    amountCents: 900,
    blurb: "A handful of stills to get a feel for the dock.",
    priceEnv: "STRIPE_PRICE_STARTER",
  },
  {
    id: "studio",
    name: "Studio",
    credits: 1000,
    amountCents: 3900,
    blurb: "Image runs plus a few short video tests.",
    priceEnv: "STRIPE_PRICE_STUDIO",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 5000,
    amountCents: 14900,
    blurb: "Serious volume for daily generation.",
    priceEnv: "STRIPE_PRICE_PRO",
  },
];

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === id);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
