import products from "@/content/products.json";
import taxonomy from "@/content/taxonomy.json";
import type { CommerceProvider, Product } from "../types";
import { applyQuery, availabilityOf } from "../query";

type Raw = (typeof products)[number];

function normalise(r: Raw): Product {
  return {
    ...r,
    currency: "INR",
    availability: availabilityOf(r.inventory),
    variants: (r.variants ?? []).map((v: { title: string; sku: string }) => ({
      id: v.sku, title: v.title, sku: v.sku, available: r.inventory > 0, price: r.price,
    })),
    tryOn: r.tryOn as Product["tryOn"],
  } as Product;
}

const ALL: Product[] = products.map(normalise);

/** Local JSON catalogue (content/*.json). Zero-config default; ideal for preview and small catalogues. */
export const localProvider: CommerceProvider = {
  name: "local",
  async getProducts(query) { return applyQuery(ALL, query); },
  async getProduct(handle) { return ALL.find((p) => p.handle === handle) ?? null; },
  async getCategories() { return taxonomy.categories; },
  async getOccasions() { return taxonomy.occasions; },
  async getCollections() { return taxonomy.collections; },
};
