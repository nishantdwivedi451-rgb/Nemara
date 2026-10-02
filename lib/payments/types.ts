export type CreateOrderInput = { amount: number; currency: "INR"; receipt: string; notes?: Record<string, string> };
export type CreatedOrder = { provider: string; orderId: string; amount: number; currency: "INR"; publicKey?: string };
export type VerifyInput = { orderId: string; paymentId: string; signature: string };

/** Any Indian gateway (Razorpay, Cashfree, PayU…) implements this server-side interface. */
export interface PaymentProvider {
  readonly name: string;
  readonly live: boolean;
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  verifyPayment(input: VerifyInput): Promise<boolean>;
}
