export function clipJobError(message: string): string {
  return message.slice(0, 1000);
}

/** Credits to return when a job is marked failed. Zero if already refunded or never charged. */
export function refundAmountForFailedJob(job: {
  creditsSpent: number;
  creditsRefunded: boolean;
}): number {
  if (job.creditsRefunded) return 0;
  return Math.max(0, job.creditsSpent);
}
