export type CreateOrderInput = { amount: number; currency: "INR"; receipt: string; notes?: Record<string, string>; /** Redirect-style gateways send the customer back here. */ returnUrl?: string };
export type CreatedOrder = { provider: string; orderId: string; amount: number; currency: "INR"; publicKey?: string; /** Hosted payment page for redirect-style gateways (PhonePe). */ redirect?: string };
export type PaymentStatus = { state: string; amount?: number; paymentId?: string };
export type VerifyInput = { orderId: string; paymentId: string; signature: string };

/** Any Indian gateway (Razorpay, Cashfree, PayU…) implements this server-side interface. */
export interface PaymentProvider {
  readonly name: string;
  readonly live: boolean;
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  verifyPayment(input: VerifyInput): Promise<boolean>;
  /** Server-side status lookup for redirect-style gateways. */
  status?(orderId: string): Promise<PaymentStatus>;
}
