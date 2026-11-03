import { NextResponse } from "next/server";
import { payments } from "@/lib/payments";
import { phonepeWebhookAuthorised } from "@/lib/payments/phonepe";
import { phonepeV1Callback } from "@/lib/payments/phonepe-v1";
import { finalizeOrder } from "@/lib/finalize-order";
import { store, storeConfigured } from "@/lib/store";
import { addressSchema, cartLinesSchema } from "@/lib/orders";

/**
 * PhonePe server-to-server callback — confirms orders even if the customer closed the tab before returning.
 *  · PG v1 (Merchant ID + Salt Key): sent automatically to the callbackUrl we pass; verified with X-VERIFY.
 *  · PG v2 (Client ID + Secret): set this URL plus a username/password in the PhonePe dashboard and the same
 *    values as PHONEPE_WEBHOOK_USERNAME / PHONEPE_WEBHOOK_PASSWORD.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { response?: string; event?: string; payload?: { merchantOrderId?: string } } | null;
  let orderId: string | null = null;
  if (body?.response) orderId = phonepeV1Callback(req.headers.get("x-verify"), body);
  else if (phonepeWebhookAuthorised(req.headers.get("authorization"))) orderId = body?.payload?.merchantOrderId ?? null;
  else return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!orderId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

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
