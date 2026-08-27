import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { getCreditPack } from "@/lib/credit-packs";
import { getStripe } from "@/lib/stripe";
import { appUrl } from "@/lib/paths";
import { publicError } from "@/lib/http-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  let body: { packId?: unknown };
  try {
    body = (await request.json()) as { packId?: unknown };
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const pack = getCreditPack(typeof body.packId === "string" ? body.packId : "");
  if (!pack) {
    return NextResponse.json({ error: "Unknown credit pack." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const priceId = process.env[pack.priceEnv]?.trim();
    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.amountCents,
            product_data: {
              name: `${pack.name} — ${pack.credits.toLocaleString("en-US")} Prism credits`,
              description: pack.blurb,
            },
          },
        };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      success_url: `${appUrl()}/credits?checkout=success`,
      cancel_url: `${appUrl()}/credits?checkout=cancel`,
      customer_email: auth.user.email,
      client_reference_id: auth.user.id,
      metadata: {
        userId: auth.user.id,
        packId: pack.id,
        credits: String(pack.credits),
        amountCents: String(pack.amountCents),
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a Checkout URL." },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: publicError(error, "Could not start Checkout.") }, { status: 503 });
  }
}
