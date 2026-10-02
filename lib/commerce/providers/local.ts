import "server-only";
import taxonomy from "@/content/taxonomy.json";
import type { CommerceProvider, Product } from "../types";
import { applyQuery, availabilityOf } from "../query";
import { loadCatalogue, type StoredProduct } from "@/lib/catalogue";

export function normalise(r: StoredProduct): Product {
  return {
    ...r,
    currency: "INR",
    availability: availabilityOf(r.inventory),
    variants: (r.variants ?? []).map((v: { title: string; sku: string }) => ({
      id: v.sku, title: v.title, sku: v.sku, available: r.inventory > 0, price: r.price,
    })),
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
