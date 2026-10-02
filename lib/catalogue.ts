import "server-only";
import { unstable_cache, revalidateTag, updateTag } from "next/cache";
import seed from "@/content/products.json";
import { store } from "@/lib/store";

/**
 * The catalogue as stored and edited in Nemara Studio. One document holds every
 * product (a small, single-editor catalogue), so the storefront reads it in one
 * cached call and every admin save refreshes the live site via the "catalogue" tag.
 * Until the first save, the seed in content/products.json is used.
 */
export type StoredProduct = (typeof seed)[number] & {
  status?: "active" | "draft";
  exclusive?: boolean;
  lowStockAt?: number;
  updatedAt?: string;
};
type Catalogue = { products: StoredProduct[]; updatedAt: string };

const COL = "catalogue", ID = "products";

async function read(): Promise<StoredProduct[]> {
  try {
    const doc = await store().get<Catalogue>(COL, ID);
    if (doc?.products?.length) return doc.products;
  } catch (e) {
    console.error("[catalogue] store read failed, using seed", e);
  }
  return seed as StoredProduct[];
}

/** Cached read used by the storefront (tag: "catalogue"). */
export const loadCatalogue = unstable_cache(read, ["nemara-catalogue-v1"], { tags: ["catalogue"], revalidate: 600 });
/** Uncached read for Nemara Studio. */
export const loadCatalogueFresh = read;

function refresh(fromAction: boolean) {
  try { fromAction ? updateTag("catalogue") : revalidateTag("catalogue", { expire: 0 }); }
  catch { revalidateTag("catalogue", { expire: 0 }); }
}

export async function saveCatalogue(products: StoredProduct[], fromAction = true) {
  await store().put<Catalogue>(COL, ID, { products, updatedAt: new Date().toISOString() });
  refresh(fromAction);
}

export async function upsertProduct(p: StoredProduct, previousHandle?: string) {
  const all = await read();
  const key = previousHandle ?? p.handle;
  const i = all.findIndex((x) => x.handle === key);
  const next = { ...p, updatedAt: new Date().toISOString() };
  if (i >= 0) all[i] = next; else all.unshift(next);
  await saveCatalogue(all);
  return next;
}

export async function removeProduct(handle: string) {
  await saveCatalogue((await read()).filter((p) => p.handle !== handle));
}

export type StockMove = { id: string; handle: string; sku: string; delta: number; after: number; reason: string; ref?: string; at: string; by: string };

/** Apply stock deltas atomically to the catalogue document and log each movement. */
export async function adjustStock(moves: { handle: string; delta: number; reason: string; ref?: string }[], by: string, fromAction = false) {
  const { newestId } = await import("@/lib/store");
  const all = await read();
  const logs: StockMove[] = [];
  for (const m of moves) {
    const p = all.find((x) => x.handle === m.handle);
    if (!p) continue;
    p.inventory = Math.max(0, (p.inventory ?? 0) + m.delta);
    logs.push({ id: newestId(), handle: p.handle, sku: p.sku, delta: m.delta, after: p.inventory, reason: m.reason, ref: m.ref, at: new Date().toISOString(), by });
  }
  if (!logs.length) return [];
  await saveCatalogue(all, fromAction);
  await Promise.all(logs.map((l) => store().put("stock_moves", l.id, l)));
  return logs;
}
