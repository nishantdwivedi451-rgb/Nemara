import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import type { PaymentProvider } from "./types";

// Used when no gateway keys are configured: the full checkout flow works end-to-end, no money moves.
const secret = () => process.env.DEMO_PAYMENT_SECRET || "nemara-demo";
export const demoProvider: PaymentProvider = {
  name: "demo",
  live: false,
  async createOrder({ amount, currency }) {
    return { provider: "demo", orderId: `demo_${randomBytes(6).toString("hex")}`, amount, currency };
  },
  async verifyPayment({ orderId, paymentId, signature }) {
    return signature === createHmac("sha256", secret()).update(`${orderId}|${paymentId}`).digest("hex");
  },
};
export const demoSign = (orderId: string, paymentId: string) => createHmac("sha256", secret()).update(`${orderId}|${paymentId}`).digest("hex");
