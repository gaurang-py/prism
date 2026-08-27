import { PgBoss } from "pg-boss";
import { GENERATE_QUEUE } from "./constants";

const globalForBoss = globalThis as unknown as { prismBoss?: Promise<PgBoss> };

function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set. Start Postgres and copy .env.example to .env.");
  }
  return url;
}

async function createBoss(): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: databaseUrl(),
    schedule: false,
    max: 4,
    application_name: "prism",
  });
  boss.on("error", (error: Error) => {
    console.error("[pg-boss]", error);
  });
  await boss.start();
  await boss.createQueue(GENERATE_QUEUE, {
    retryLimit: 0,
    expireInSeconds: 1800,
    deleteAfterSeconds: 60 * 60 * 24 * 7,
  });
  return boss;
}

export function getBoss(): Promise<PgBoss> {
  globalForBoss.prismBoss ??= createBoss();
  return globalForBoss.prismBoss;
}

export async function enqueueGenerateJob(jobId: string): Promise<void> {
  const boss = await getBoss();
  await boss.send(
    GENERATE_QUEUE,
    { jobId },
    { retryLimit: 0, expireInSeconds: 1800 },
  );
}
