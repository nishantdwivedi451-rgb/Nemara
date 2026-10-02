import "server-only";
import { store, newestId } from "@/lib/store";
import type { Address } from "@/lib/orders";

export const ORDER_STATUSES = ["pending_payment", "paid", "processing", "packed", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment", paid: "Paid", processing: "Processing", packed: "Packed",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};
export type OrderItem = { handle: string; name: string; sku: string; variant?: string; quantity: number; unit: number; total: number };
export type Order = {
  id: string; reference: string; status: OrderStatus; gateway: string; gatewayOrderId: string; paymentId?: string; demo: boolean;
  customer: Address; items: OrderItem[]; subtotal: number; shipping: number; total: number;
  tracking?: { courier?: string; number?: string; url?: string }; notes?: string;
  timeline: { at: string; status: OrderStatus | "note"; note?: string; by: string }[];
  createdAt: string; updatedAt: string;
};
export type Checkout = { id: string; gatewayOrderId: string; customer: Address; items: OrderItem[]; total: number; createdAt: string };

export async function recordCheckout(c: Omit<Checkout, "id" | "createdAt">) {
  const id = newestId();
  await store().put("checkouts", id, { ...c, id, createdAt: new Date().toISOString() });
}

export async function recordPaidOrder(o: Omit<Order, "id" | "status" | "timeline" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const id = newestId();
  const order: Order = { ...o, id, status: "paid", createdAt: now, updatedAt: now, timeline: [{ at: now, status: "paid", by: "system", note: o.demo ? "Demo payment" : `Paid via ${o.gateway}` }] };
  await store().put("orders", id, order);
  return order;
}

export async function getOrder(id: string) { return store().get<Order>("orders", id); }
export async function saveOrder(o: Order) { o.updatedAt = new Date().toISOString(); await store().put("orders", o.id, o); }
