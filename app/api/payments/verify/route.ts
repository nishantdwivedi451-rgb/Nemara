import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema, cartLinesSchema, priceCart } from "@/lib/orders";
import { payments } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { currentCustomer } from "@/lib/customers";
import { finalizeOrder } from "@/lib/finalize-order";

const body = z.object({
  provider: z.string(), orderId: z.string().max(120), paymentId: z.string().max(120).default(""), signature: z.string().max(256).default(""),
  lines: cartLinesSchema, address: addressSchema,
});

export async function POST(req: Request) {
  if (!rateLimit(`verify:${clientIp(req)}`, 20)) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400 });
  const d = parsed.data;
  const gateway = payments();
  if (d.provider !== gateway.name) return NextResponse.json({ error: "Payment provider mismatch." }, { status: 400 });

  let paymentId = d.paymentId;
  if (gateway.status) {
    // redirect gateways (PhonePe): ask the gateway, never trust the browser — and match the amount
    const st = await gateway.status(d.orderId).catch((e) => { console.error("[verify] status", e); return null; });
    if (!st) return NextResponse.json({ error: "We couldn't reach the payment gateway. Please refresh in a minute." }, { status: 502 });
    if (st.state === "PENDING") return NextResponse.json({ pending: true }, { status: 202 });
    if (st.state !== "COMPLETED") return NextResponse.json({ failed: true, error: "The payment didn't go through. No money was taken — please try again." }, { status: 400 });
    const priced = await priceCart(d.lines);
    if (st.amount !== undefined && Math.abs(st.amount - priced.total) > 0.01) {
      console.error("[verify] amount mismatch", d.orderId, st.amount, priced.total);
      return NextResponse.json({ error: "Your payment amount didn't match the order. Please contact us — we'll sort it out or refund you." }, { status: 400 });
    }
    paymentId = st.paymentId ?? d.orderId;
  } else {
    const ok = gateway.name === "demo"
      ? d.orderId.startsWith("demo_") // demo mode only exists when no real gateway is configured
      : await gateway.verifyPayment({ orderId: d.orderId, paymentId: d.paymentId, signature: d.signature });
    if (!ok) return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted it will be refunded — please contact us." }, { status: 400 });
  }

  const account = await currentCustomer().catch(() => null);
  const r = await finalizeOrder({ gateway: gateway.name, live: gateway.live, orderId: d.orderId, paymentId, lines: d.lines, address: d.address, accountPhone: account?.phone });
  return NextResponse.json({ ok: true, reference: r.reference, total: r.total, demo: gateway.name === "demo" });
}
