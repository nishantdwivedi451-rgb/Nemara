import "server-only";
import type { PaymentProvider } from "./types";
import { razorpayProvider } from "./razorpay";
import { demoProvider } from "./demo";
import { phonepeProvider } from "./phonepe";

/** PhonePe is Nemara's gateway; Razorpay remains available as a fallback; demo mode runs when neither is configured. */
export function payments(): PaymentProvider {
  const pp = { id: process.env.PHONEPE_CLIENT_ID, secret: process.env.PHONEPE_CLIENT_SECRET };
  if (pp.id && pp.secret) return phonepeProvider({ clientId: pp.id, clientSecret: pp.secret, clientVersion: process.env.PHONEPE_CLIENT_VERSION || "1", env: process.env.PHONEPE_ENV === "production" ? "production" : "sandbox" });
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (id && secret) return razorpayProvider(id, secret);
  return demoProvider;
}
export type { PaymentProvider } from "./types";
