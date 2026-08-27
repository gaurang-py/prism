import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { publicError } from "@/lib/http-error";
import { isExpired, serializeJob } from "@/lib/serialize-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const row = await prisma.job.findUnique({ where: { id } });
    if (!row || isExpired(row)) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    return NextResponse.json({ job: await serializeJob(row) });
  } catch (error) {
    const message = publicError(error, "Failed to load job");
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
