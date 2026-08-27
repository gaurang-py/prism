export function publicError(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : fallback;
  if (/DATABASE_URL/.test(message)) {
    return "DATABASE_URL is not set. Start Postgres and copy .env.example to .env.";
  }
  const first = message
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("Invalid `") && !line.startsWith("→"));
  if (first && first.length < 280) return first;
  return fallback;
}
