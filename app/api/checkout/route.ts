import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema, cartLinesSchema, priceCart } from "@/lib/orders";
import { commerce } from "@/lib/commerce";
import { payments } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { recordCheckout } from "@/lib/oms";
import { currentCustomer } from "@/lib/customers";
import { storeConfigured } from "@/lib/store";

const body = z.object({ lines: cartLinesSchema, address: addressSchema, company: z.string().optional() });

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 12)) return NextResponse.json({ error: "Too many attempts — please wait a minute." }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0] === "address" && i.path[1]) fields[String(i.path[1])] ||= i.message.includes("Invalid") || i.code === "too_small" ? "Please check this field" : i.message;
    return NextResponse.json({ error: "Please check the highlighted details.", fields }, { status: 400 });
  }
  if (parsed.data.company) return NextResponse.json({ error: "Unable to process." }, { status: 400 }); // honeypot

  // Orders are placed from a verified Nemara account (OTP on mobile + email) whenever accounts are available.
  if (storeConfigured()) {
    const customer = await currentCustomer();
    if (!customer) return NextResponse.json({ error: "Please verify your mobile and email to place your order.", needAuth: true }, { status: 401 });
    parsed.data.address.email = customer.email;
    parsed.data.address.phone = customer.phone;
  }

  try {
    // Shopify (or any hosted-checkout backend) takes over payment entirely.
    if (commerce.createHostedCheckout) {
      const { url } = await commerce.createHostedCheckout(parsed.data.lines);
      return NextResponse.json({ provider: commerce.name, redirect: url });
    }
    const priced = await priceCart(parsed.data.lines);
    const receipt = `NEM-${Date.now().toString(36).toUpperCase()}`;
    const order = await payments().createOrder({ amount: priced.total, currency: "INR", receipt, notes: { receipt, pincode: parsed.data.address.pincode } });
    // abandoned-checkout follow-up in Nemara Studio; never blocks payment
    await recordCheckout({ gatewayOrderId: order.orderId, customer: parsed.data.address, items: priced.items, total: priced.total }).catch((e) => console.error("[checkout] record failed", e));
    return NextResponse.json({ ...order, summary: { subtotal: priced.subtotal, shipping: priced.shipping, total: priced.total } });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json({ error: (e as Error).message || "Checkout is unavailable right now." }, { status: 422 });
  }
}
