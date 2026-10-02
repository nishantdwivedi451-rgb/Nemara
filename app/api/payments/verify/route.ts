import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema, cartLinesSchema, priceCart } from "@/lib/orders";
import { payments } from "@/lib/payments";
import { notify } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { recordPaidOrder } from "@/lib/oms";
import { adjustStock } from "@/lib/catalogue";
import { store } from "@/lib/store";
import { attachOrder, currentCustomer } from "@/lib/customers";

const body = z.object({
  provider: z.string(), orderId: z.string().max(120), paymentId: z.string().max(120), signature: z.string().max(256),
  lines: cartLinesSchema, address: addressSchema,
});

export async function POST(req: Request) {
  if (!rateLimit(`verify:${clientIp(req)}`, 20)) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment confirmation." }, { status: 400 });
  const d = parsed.data;
  const gateway = payments();
  if (d.provider !== gateway.name) return NextResponse.json({ error: "Payment provider mismatch." }, { status: 400 });

  const ok = gateway.name === "demo"
    ? d.orderId.startsWith("demo_") // demo mode only exists when no real gateway is configured
    : await gateway.verifyPayment({ orderId: d.orderId, paymentId: d.paymentId, signature: d.signature });
  if (!ok) return NextResponse.json({ error: "We couldn't verify this payment. If money was deducted it will be refunded — please contact us." }, { status: 400 });

  const priced = await priceCart(d.lines);
  const reference = `NEM-${d.orderId.slice(-8).toUpperCase()}`;
  const keyId = d.orderId.replace(/[^a-zA-Z0-9_-]/g, "");
  // idempotent: a repeated callback for the same gateway order never creates a second order
  const existing = await store().get<{ id: string }>("order_keys", keyId).catch(() => null);
  if (!existing) {
    try {
      const order = await recordPaidOrder({ reference, gateway: gateway.name, gatewayOrderId: d.orderId, paymentId: d.paymentId, demo: gateway.name === "demo", customer: d.address, ...priced });
      await store().put("order_keys", keyId, { id: order.id });
      const account = await currentCustomer().catch(() => null);
      await attachOrder(account?.phone ?? d.address.phone, order.id).catch((e) => console.error("[verify] attach failed", e));
      await adjustStock(priced.items.map((i) => ({ handle: i.handle, delta: -i.quantity, reason: "Order", ref: reference })), "system");
    } catch (e) { console.error("[verify] persisting order failed", e); }
    await notify("order", { reference, provider: gateway.name, live: gateway.live, orderId: d.orderId, paymentId: d.paymentId, customer: d.address, ...priced });
  }
  return NextResponse.json({ ok: true, reference, total: priced.total, demo: gateway.name === "demo" });
}
