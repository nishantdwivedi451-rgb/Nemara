import "server-only";
import taxonomy from "@/content/taxonomy.json";
import type { CommerceProvider, Product } from "../types";
import { applyQuery, availabilityOf } from "../query";
import { loadCatalogue, type StoredProduct } from "@/lib/catalogue";

type StoredVariant = { title: string; sku: string; price?: number | null; available?: boolean };

/** Sizes / options from Studio. Each can carry its own price; the product shows "From" the lowest available one. */
function variantsOf(r: StoredProduct) {
  const variants = ((r.variants ?? []) as StoredVariant[]).map((v) => ({
    id: v.sku, title: v.title, sku: v.sku, available: r.inventory > 0 && v.available !== false, price: v.price || r.price,
  }));
  const priced = variants.filter((v) => v.available).map((v) => v.price);
  const price = priced.length ? Math.min(...priced) : r.price;
  return { variants, price, priceVaries: new Set(variants.map((v) => v.price)).size > 1 };
}

export function normalise(r: StoredProduct): Product {
  return {
    ...r,
    currency: "INR",
    availability: availabilityOf(r.inventory),
    ...variantsOf(r),
    tryOn: r.tryOn as Product["tryOn"],
    exclusive: !!r.exclusive,
  } as Product;
}

async function live(): Promise<Product[]> {
  return (await loadCatalogue()).filter((p) => p.status !== "draft").map(normalise);
}

/** Nemara catalogue: managed in Nemara Studio (/admin), seeded from content/products.json. */
export const localProvider: CommerceProvider = {
  name: "local",
  async getProducts(query) { return applyQuery(await live(), query); },
  async getProduct(handle) { return (await live()).find((p) => p.handle === handle) ?? null; },
  async getCategories() { return taxonomy.categories; },
  async getOccasions() { return taxonomy.occasions; },
  async getCollections() { return taxonomy.collections; },
};
