import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./types";

/** Razorpay Orders API + Checkout (UPI, cards, net banking, wallets, EMI). Secrets stay server-side. */
export function razorpayProvider(keyId: string, keySecret: string): PaymentProvider {
  return {
    name: "razorpay",
    live: keyId.startsWith("rzp_live_"),
    async createOrder({ amount, currency, receipt, notes }) {
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64") },
        body: JSON.stringify({ amount: Math.round(amount * 100), currency, receipt, notes }),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.description || "Razorpay order creation failed");
      return { provider: "razorpay", orderId: data.id, amount, currency, publicKey: keyId };
    },
    async verifyPayment({ orderId, paymentId, signature }) {
      const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
      const a = Buffer.from(expected), b = Buffer.from(signature || "");
      return a.length === b.length && timingSafeEqual(a, b);
    },
  };
}
