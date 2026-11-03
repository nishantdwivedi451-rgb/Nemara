import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./types";

/**
 * PhonePe PG — Standard Checkout v1 (Merchant ID + Salt Key, X-VERIFY checksum).
 * Accounts issued a Client ID/Secret use ./phonepe.ts (v2) instead; lib/payments picks whichever keys are set.
 *   pay:    POST {base}/pg/v1/pay      body { request: base64(payload) }, X-VERIFY = sha256(base64 + "/pg/v1/pay" + saltKey) + "###" + saltIndex
 *   status: GET  {base}/pg/v1/status/{merchantId}/{txnId}, X-VERIFY = sha256(path + saltKey) + "###" + saltIndex, X-MERCHANT-ID
 *   S2S callback: body { response: base64 }, X-VERIFY = sha256(response + saltKey) + "###" + saltIndex
 */
const BASE = { sandbox: "https://api-preprod.phonepe.com/apis/pg-sandbox", production: "https://api.phonepe.com/apis/hermes" };

export type PhonePeV1Config = { merchantId: string; saltKey: string; saltIndex: string; env: "sandbox" | "production" };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function phonepeV1Provider(cfg: PhonePeV1Config): PaymentProvider {
  const base = process.env.PHONEPE_API_BASE || BASE[cfg.env];
  const xverify = (s: string) => `${sha256(s + cfg.saltKey)}###${cfg.saltIndex}`;

  return {
    name: "phonepe",
    live: cfg.env === "production",
    async createOrder({ amount, currency, receipt, returnUrl, notes }) {
      const payload = {
        merchantId: cfg.merchantId,
        merchantTransactionId: receipt,
        merchantUserId: `MU${sha256(notes?.phone || receipt).slice(0, 20).toUpperCase()}`,
        amount: Math.round(amount * 100),
        redirectUrl: returnUrl,
        redirectMode: "REDIRECT",
        callbackUrl: returnUrl ? new URL("/api/payments/phonepe/webhook", returnUrl).toString() : undefined,
        ...(notes?.phone && /^\d{10}$/.test(notes.phone) ? { mobileNumber: notes.phone } : {}),
        paymentInstrument: { type: "PAY_PAGE" },
      };
      const request = Buffer.from(JSON.stringify(payload)).toString("base64");
      const res = await fetch(`${base}/pg/v1/pay`, {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", accept: "application/json", "X-VERIFY": xverify(request + "/pg/v1/pay") },
        body: JSON.stringify({ request }),
      });
      const d = await res.json().catch(() => ({}));
      const url = d?.data?.instrumentResponse?.redirectInfo?.url;
      if (!res.ok || !d.success || !url) throw new Error(d?.message || "PhonePe could not start the payment");
      return { provider: "phonepe", orderId: receipt, amount, currency, redirect: url };
    },
    async verifyPayment({ orderId }) {
      return (await this.status!(orderId)).state === "COMPLETED";
    },
    async status(orderId) {
      const path = `/pg/v1/status/${cfg.merchantId}/${encodeURIComponent(orderId)}`;
      const res = await fetch(base + path, {
        cache: "no-store",
        headers: { "Content-Type": "application/json", accept: "application/json", "X-VERIFY": xverify(path), "X-MERCHANT-ID": cfg.merchantId },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok && !d?.code) throw new Error(`PhonePe status failed (${res.status})`);
      // codes: PAYMENT_SUCCESS | PAYMENT_PENDING | PAYMENT_ERROR | PAYMENT_DECLINED | TIMED_OUT …
      const state = d.code === "PAYMENT_SUCCESS" || d?.data?.state === "COMPLETED" ? "COMPLETED"
        : d.code === "PAYMENT_PENDING" || d.code === "INTERNAL_SERVER_ERROR" || d?.data?.state === "PENDING" ? "PENDING" : "FAILED";
      return { state, amount: typeof d?.data?.amount === "number" ? d.data.amount / 100 : undefined, paymentId: d?.data?.transactionId };
    },
  };
}

/** Verifies a v1 server-to-server callback and returns the decoded merchant transaction id. */
export function phonepeV1Callback(xVerify: string | null, body: { response?: string } | null): string | null {
  const saltKey = process.env.PHONEPE_SALT_KEY, saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
  if (!saltKey || !xVerify || !body?.response) return null;
  const expected = Buffer.from(`${sha256(body.response + saltKey)}###${saltIndex}`), got = Buffer.from(xVerify.trim());
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try { return JSON.parse(Buffer.from(body.response, "base64").toString("utf8"))?.data?.merchantTransactionId ?? null; } catch { return null; }
}
