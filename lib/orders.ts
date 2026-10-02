import "server-only";
import { z } from "zod";
import { commerce } from "@/lib/commerce";
import { shippingFor } from "@/lib/site";

export const cartLinesSchema = z.array(z.object({
  handle: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  variantId: z.string().max(200).optional(),
  quantity: z.number().int().min(1).max(10),
})).min(1).max(30);

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().max(120),
  phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
  line1: z.string().trim().min(3).max(160),
  line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  gift: z.boolean().optional().default(false),
  note: z.string().trim().max(300).optional().default(""),
});
export type Address = z.infer<typeof addressSchema>;

/** Prices are always recomputed on the server from the catalogue — the client total is never trusted. */
export async function priceCart(lines: z.infer<typeof cartLinesSchema>) {
  const items = await Promise.all(lines.map(async (l) => {
    const p = await commerce.getProduct(l.handle);
    if (!p) throw new Error(`Unknown piece: ${l.handle}`);
    if (p.availability === "sold_out") throw new Error(`${p.name} is sold out`);
    const variant = l.variantId ? p.variants.find((v) => v.id === l.variantId) : undefined;
    if (l.variantId && !variant) throw new Error(`Unknown size for ${p.name}`);
    if (!l.variantId && p.variants.length) throw new Error(`Choose a size for ${p.name}`);
    const unit = variant?.price ?? p.price;
    return { handle: p.handle, name: p.name, sku: variant?.sku ?? p.sku, variant: variant?.title, quantity: l.quantity, unit, total: unit * l.quantity };
  }));
  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const shipping = shippingFor(subtotal);
  return { items, subtotal, shipping, total: subtotal + shipping };
}
