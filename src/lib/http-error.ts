export function publicError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  if (/DATABASE_URL/.test(message)) {
    return "DATABASE_URL is not set. Start Postgres and copy .env.example to .env.";
  }
  if (/AUTH_SECRET/.test(message)) {
    return "AUTH_SECRET is not set. Copy it from .env.example into .env.";
  }
  if (/STRIPE_SECRET_KEY/.test(message)) {
    return "STRIPE_SECRET_KEY is not set. Add your Stripe test secret key to .env — Checkout cannot run without it.";
  }
  if (/STRIPE_WEBHOOK_SECRET/.test(message)) {
    return "STRIPE_WEBHOOK_SECRET is not set. Run stripe listen and copy the whsec_ signing secret.";
  }
  const first = message
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("Invalid `") && !line.startsWith("→"));
  if (first && first.length < 280) return first;
  return fallback;
}
