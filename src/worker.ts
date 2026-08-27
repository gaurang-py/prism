import "./lib/load-env";
import { startWorker } from "./lib/process-job";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and start Postgres.");
    process.exit(1);
  }
  await startWorker();
}

main().catch((error) => {
  console.error("[prism-worker] failed to start", error);
  process.exit(1);
});
