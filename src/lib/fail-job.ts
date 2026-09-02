import { prisma } from "./db";
import { clipJobError } from "./credit-refund";

/**
 * Mark a job as failed and refund `creditsSpent` exactly once.
 * `creditsRefunded` is the idempotency latch so a worker failure and an
 * enqueue failure cannot double-credit the user.
 */
export async function failJob(jobId: string, message: string): Promise<void> {
  const now = new Date();
  const errorMessage = clipJobError(message);

  await prisma.$transaction(async (tx) => {
    const marked = await tx.job.updateMany({
      where: { id: jobId, status: { not: "done" } },
      data: {
        status: "error",
        errorMessage,
        progress: 0,
        completedAt: now,
      },
    });
    if (marked.count === 0) return;

    const claimed = await tx.job.updateMany({
      where: { id: jobId, creditsRefunded: false, creditsSpent: { gt: 0 } },
      data: { creditsRefunded: true },
    });
    if (claimed.count === 0) return;

    const job = await tx.job.findUnique({
      where: { id: jobId },
      select: { userId: true, creditsSpent: true },
    });
    if (!job) return;

    await tx.user.update({
      where: { id: job.userId },
      data: { credits: { increment: job.creditsSpent } },
    });
  });
}
