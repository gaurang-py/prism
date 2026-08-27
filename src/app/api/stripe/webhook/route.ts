import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, webhookSecret } from "@/lib/stripe";
import { publicError } from "@/lib/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const raw = await request.text();
    event = getStripe().webhooks.constructEvent(raw, signature, webhookSecret());
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Invalid Stripe webhook signature.") },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      await creditFromCheckout(event);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: publicError(error, "Webhook handler failed.") },
      { status: 500 },
    );
  }
}

async function creditFromCheckout(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId || session.client_reference_id;
  const packId = session.metadata?.packId || "unknown";
  const credits = Number.parseInt(session.metadata?.credits || "0", 10);
  const amountCents =
    Number.parseInt(session.metadata?.amountCents || "0", 10) || session.amount_total || 0;

  if (!userId || !Number.isFinite(credits) || credits <= 0) {
    throw new Error("Checkout session is missing userId or credits metadata.");
  }

  await prisma.$transaction(async (tx) => {
    const seen = await tx.stripeEvent.findUnique({ where: { id: event.id } });
    if (seen) return;

    await tx.stripeEvent.create({
      data: { id: event.id, type: event.type },
    });

    const existingPurchase = await tx.creditPurchase.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (existingPurchase) return;

    await tx.creditPurchase.create({
      data: {
        userId,
        stripeSessionId: session.id,
        packId,
        credits,
        amountCents,
      },
    });
    await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: credits } },
    });
  });
}
