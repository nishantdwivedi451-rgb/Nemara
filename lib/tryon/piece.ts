import type { Product, TryOnAnchor } from "@/lib/commerce/types";

/** Serializable try-on reference passed from server pages into the client studio. */
export type TryOnPiece = { handle: string; sku: string; name: string; price: number; image: string; anchor: TryOnAnchor; overlay: string; scale?: number; needsSize?: boolean };

export const toPiece = (p: Product): TryOnPiece => ({
  handle: p.handle, sku: p.sku, name: p.name, price: p.price, image: p.images[0].src,
  anchor: p.tryOn!.anchor, overlay: p.tryOn!.overlay, scale: p.tryOn!.scale, needsSize: p.variants.length > 0,
});
