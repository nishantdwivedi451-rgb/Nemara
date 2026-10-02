import "server-only";
import type { PaymentProvider } from "./types";
import { razorpayProvider } from "./razorpay";
import { demoProvider } from "./demo";

export function payments(): PaymentProvider {
  const id = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (id && secret) return razorpayProvider(id, secret);
  return demoProvider;
}
export type { PaymentProvider } from "./types";
