import "server-only";
import type { PaymentProvider } from "./types";
import { razorpayProvider } from "./razorpay";
import { demoProvider } from "./demo";
import { phonepeProvider } from "./phonepe";
import { phonepeV1Provider } from "./phonepe-v1";

/** PhonePe is Nemara's gateway; Razorpay remains available as a fallback; demo mode runs when neither is configured. */
export function payments(): PaymentProvider {
  const env = process.env.PHONEPE_ENV === "production" ? "production" : "sandbox";
  // PhonePe issues either Merchant ID + Salt Key (PG v1) or Client ID + Secret (PG v2) — use whichever is set
  const mid = process.env.PHONEPE_MERCHANT_ID, salt = process.env.PHONEPE_SALT_KEY;
  if (mid && salt) return phonepeV1Provider({ merchantId: mid, saltKey: salt, saltIndex: process.env.PHONEPE_SALT_INDEX || "1", env });
  const pp = { id: process.env.PHONEPE_CLIENT_ID, secret: process.env.PHONEPE_CLIENT_SECRET };
  if (pp.id && pp.secret) return phonepeProvider({ clientId: pp.id, clientSecret: pp.secret, clientVersion: process.env.PHONEPE_CLIENT_VERSION || "1", env });
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (id && secret) return razorpayProvider(id, secret);
  return demoProvider;
}
export type { PaymentProvider } from "./types";
