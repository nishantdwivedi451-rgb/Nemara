import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./types";

/**
 * PhonePe Payment Gateway — Standard Checkout (v2, redirect flow).
 *   1. OAuth client-credentials token  →  2. create payment (get redirectUrl)  →
 *   3. customer pays on PhonePe and returns to /checkout/return  →  4. we read the order status server-side.
 * Endpoints are overridable (PHONEPE_AUTH_URL / PHONEPE_API_BASE) in case PhonePe changes them;
 * always complete a full UAT (sandbox) test before switching PHONEPE_ENV to production.
 */
const ENDPOINTS = {
  sandbox: { auth: "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token", api: "https://api-preprod.phonepe.com/apis/pg-sandbox" },
  production: { auth: "https://api.phonepe.com/apis/identity-manager/v1/oauth/token", api: "https://api.phonepe.com/apis/pg" },
};

export type PhonePeConfig = { clientId: string; clientSecret: string; clientVersion: string; env: "sandbox" | "production" };
let token: { value: string; exp: number } | null = null;

export function phonepeProvider(cfg: PhonePeConfig): PaymentProvider {
  const ep = { auth: process.env.PHONEPE_AUTH_URL || ENDPOINTS[cfg.env].auth, api: process.env.PHONEPE_API_BASE || ENDPOINTS[cfg.env].api };

  async function auth() {
    if (token && token.exp - 60 > Date.now() / 1000) return token.value;
    const res = await fetch(ep.auth, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, cache: "no-store",
      body: new URLSearchParams({ client_id: cfg.clientId, client_version: cfg.clientVersion, client_secret: cfg.clientSecret, grant_type: "client_credentials" }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || !d.access_token) throw new Error("PhonePe authorisation failed");
    token = { value: d.access_token, exp: Number(d.expires_at) || Date.now() / 1000 + 600 };
    return token.value;
  }
  const call = async (path: string, init: RequestInit = {}) => {
    const res = await fetch(ep.api + path, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", Authorization: `O-Bearer ${await auth()}`, ...init.headers } });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d?.message || `PhonePe request failed (${res.status})`);
    return d;
  };

  return {
    name: "phonepe",
    live: cfg.env === "production",
    async createOrder({ amount, currency, receipt, returnUrl }) {
      const d = await call("/checkout/v2/pay", {
        method: "POST",
        body: JSON.stringify({
          merchantOrderId: receipt, amount: Math.round(amount * 100), expireAfter: 1200,
          metaInfo: { udf1: receipt },
          paymentFlow: { type: "PG_CHECKOUT", message: "Nemara order", merchantUrls: { redirectUrl: returnUrl } },
        }),
      });
      if (!d.redirectUrl) throw new Error("PhonePe did not return a payment page");
      return { provider: "phonepe", orderId: receipt, amount, currency, redirect: d.redirectUrl };
    },
    async verifyPayment({ orderId }) {
      return (await this.status!(orderId)).state === "COMPLETED";
    },
    async status(orderId) {
      const d = await call(`/checkout/v2/order/${encodeURIComponent(orderId)}/status`, { method: "GET" });
      const paid = (d.paymentDetails ?? []).find((p: { state?: string }) => p.state === "COMPLETED");
      return { state: String(d.state ?? "PENDING"), amount: typeof d.amount === "number" ? d.amount / 100 : undefined, paymentId: paid?.transactionId ?? d.orderId };
    },
  };
}

/** PhonePe signs webhooks with Authorization: SHA256(username:password) set in the PhonePe dashboard. */
export function phonepeWebhookAuthorised(header: string | null) {
  const u = process.env.PHONEPE_WEBHOOK_USERNAME, p = process.env.PHONEPE_WEBHOOK_PASSWORD;
  if (!u || !p || !header) return false;
  const expected = Buffer.from(createHash("sha256").update(`${u}:${p}`).digest("hex"));
  const got = Buffer.from(header.replace(/^SHA256\s+/i, "").trim().toLowerCase());
  return expected.length === got.length && timingSafeEqual(expected, got);
}
