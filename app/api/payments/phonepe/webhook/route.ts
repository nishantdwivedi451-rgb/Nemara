import { NextResponse } from "next/server";
import { payments } from "@/lib/payments";
import { phonepeWebhookAuthorised } from "@/lib/payments/phonepe";
import { finalizeOrder } from "@/lib/finalize-order";
import { store, storeConfigured } from "@/lib/store";
import { addressSchema, cartLinesSchema } from "@/lib/orders";

/**
 * PhonePe server-to-server callback. Confirms orders even if the customer closed the tab before returning.
 * Configure in the PhonePe dashboard: URL https://nemara.shop/api/payments/phonepe/webhook plus a username/password
 * (set PHONEPE_WEBHOOK_USERNAME / PHONEPE_WEBHOOK_PASSWORD to the same values).
 */
export async function POST(req: Request) {
  if (!phonepeWebhookAuthorised(req.headers.get("authorization"))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json().catch(() => null) as { event?: string; payload?: { merchantOrderId?: string; state?: string } } | null;
  const orderId = body?.payload?.merchantOrderId;
  if (!orderId) return NextResponse.json({ ok: true });
  const gateway = payments();
  if (gateway.name !== "phonepe" || !gateway.status) return NextResponse.json({ ok: true });

  // never trust the callback body alone — re-read the status from PhonePe
  const st = await gateway.status(orderId).catch(() => null);
  if (st?.state !== "COMPLETED" || !storeConfigured()) return NextResponse.json({ ok: true });
  const pending = await store().get<{ lines: unknown; address: unknown }>("pending_payments", orderId).catch(() => null);
  const lines = cartLinesSchema.safeParse(pending?.lines), address = addressSchema.safeParse(pending?.address);
  if (!lines.success || !address.success) { console.error("[phonepe webhook] no pending checkout for", orderId); return NextResponse.json({ ok: true }); }
  await finalizeOrder({ gateway: "phonepe", live: gateway.live, orderId, paymentId: st.paymentId ?? orderId, lines: lines.data, address: address.data });
  return NextResponse.json({ ok: true });
}
