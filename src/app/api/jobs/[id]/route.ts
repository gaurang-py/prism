import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { isExpired, serializeJob } from "@/lib/serialize-job";
import { requireUser } from "@/lib/require-user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  try {
    const row = await prisma.job.findUnique({ where: { id } });
    if (!row || row.userId !== auth.user.id || isExpired(row)) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json({ job: await serializeJob(row) });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Failed to load job") }, { status: 503 });
  }
}
