import "server-only";
import { priceCart, type Address, type cartLinesSchema } from "@/lib/orders";
import type { z } from "zod";

type CartLine = z.infer<typeof cartLinesSchema>[number];
import { notify } from "@/lib/notify";
import { recordPaidOrder } from "@/lib/oms";
import { adjustStock } from "@/lib/catalogue";
import { store } from "@/lib/store";
import { attachOrder } from "@/lib/customers";

/**
 * Turns a verified gateway payment into a Nemara order. Idempotent per gateway order id, so the
 * customer's return page and the gateway webhook can both call it safely.
 */
export async function finalizeOrder(o: { gateway: string; live: boolean; orderId: string; paymentId: string; lines: CartLine[]; address: Address; accountPhone?: string }) {
  const priced = await priceCart(o.lines);
  const reference = `NEM-${o.orderId.slice(-8).toUpperCase()}`;
  const keyId = o.orderId.replace(/[^a-zA-Z0-9_-]/g, "");
  const existing = await store().get<{ id: string }>("order_keys", keyId).catch(() => null);
  if (!existing) {
    try {
      const order = await recordPaidOrder({ reference, gateway: o.gateway, gatewayOrderId: o.orderId, paymentId: o.paymentId, demo: o.gateway === "demo", customer: o.address, ...priced });
      await store().put("order_keys", keyId, { id: order.id });
      await attachOrder(o.accountPhone ?? o.address.phone, order.id).catch((e) => console.error("[order] attach failed", e));
      await adjustStock(priced.items.map((i) => ({ handle: i.handle, delta: -i.quantity, reason: "Order", ref: reference })), "system");
    } catch (e) { console.error("[order] persisting order failed", e); }
    await notify("order", { reference, provider: o.gateway, live: o.live, orderId: o.orderId, paymentId: o.paymentId, customer: o.address, ...priced });
  }
  return { reference, total: priced.total, priced };
}
