import Stripe from "stripe";

export function stripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your Stripe test secret key to .env — Checkout cannot run without it.",
    );
  }
  return key;
}

export function getStripe(): Stripe {
  return new Stripe(stripeSecret());
}

export function webhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Run `stripe listen --forward-to localhost:43123/api/stripe/webhook` and copy the whsec_… signing secret.",
    );
  }
  return secret;
}
