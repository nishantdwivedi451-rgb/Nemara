import "server-only";
import taxonomy from "@/content/taxonomy.json";
import type { CartLineInput, CommerceProvider, Product } from "../types";
import { applyQuery, availabilityOf } from "../query";

/**
 * Shopify Storefront API provider.
 * Enable with COMMERCE_PROVIDER=shopify + SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_ACCESS_TOKEN.
 * Nemara-specific fields live in product metafields under the `nemara` namespace
 * (see docs/CATALOGUE.md for the full mapping).
 */
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-07";

async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) throw new Error("Shopify is not configured (SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_ACCESS_TOKEN).");
  const res = await fetch(`https://${domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 300, tags: ["shopify"] },
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`Shopify error: ${JSON.stringify(json.errors ?? res.status)}`);
  return json.data as T;
}

const MF = ["subtitle", "category", "material", "dimensions", "care", "artist", "story", "try_on", "featured", "occasions"];
const PRODUCT_FIELDS = `
  id handle title description createdAt tags productType totalInventory
  priceRange { minVariantPrice { amount } }
  compareAtPriceRange { maxVariantPrice { amount } }
  images(first: 8) { nodes { url altText width height } }
  variants(first: 20) { nodes { id title sku availableForSale price { amount } } }
  collections(first: 10) { nodes { handle } }
  metafields(identifiers: [${MF.map((k) => `{namespace: "nemara", key: "${k}"}`).join(",")}]) { key value }
`;

type SNode = {
  id: string; handle: string; title: string; description: string; createdAt: string; tags: string[]; productType: string; totalInventory: number | null;
  priceRange: { minVariantPrice: { amount: string } }; compareAtPriceRange: { maxVariantPrice: { amount: string } };
  images: { nodes: { url: string; altText: string | null; width: number; height: number }[] };
  variants: { nodes: { id: string; title: string; sku: string; availableForSale: boolean; price: { amount: string } }[] };
  collections: { nodes: { handle: string }[] };
  metafields: ({ key: string; value: string } | null)[];
};

const ROLES = ["hero", "worn", "detail", "story"];
function map(n: SNode): Product {
  const mf = Object.fromEntries(n.metafields.filter(Boolean).map((m) => [m!.key, m!.value]));
  const parse = <T,>(v: string | undefined, fb: T): T => { try { return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } };
  const price = Number(n.priceRange.minVariantPrice.amount);
  const compare = Number(n.compareAtPriceRange.maxVariantPrice.amount);
  const inv = n.totalInventory ?? (n.variants.nodes.some((v) => v.availableForSale) ? 10 : 0);
  return {
    id: n.id, handle: n.handle, name: n.title, description: n.description,
    sku: n.variants.nodes[0]?.sku ?? n.handle,
    subtitle: mf.subtitle, price, compareAtPrice: compare > price ? compare : null, currency: "INR",
    inventory: inv, availability: availabilityOf(inv),
    category: mf.category || n.productType.toLowerCase().replace(/\s+/g, "-"),
    occasions: parse<string[]>(mf.occasions, n.tags.filter((t) => t.startsWith("occasion:")).map((t) => t.slice(9))),
    collections: n.collections.nodes.map((c) => c.handle),
    tags: n.tags, material: mf.material ?? "", dimensions: mf.dimensions ?? "", care: mf.care ?? "",
    artist: mf.artist ?? "", featured: mf.featured === "true", createdAt: n.createdAt,
    images: n.images.nodes.map((im, i) => ({ src: im.url, alt: im.altText ?? n.title, role: ROLES[i] ?? "gallery", width: im.width, height: im.height })),
    story: parse(mf.story, { idea: { body: "" }, hand: { contribution: "" }, making: { body: "" }, moment: { body: "" } }),
    variants: n.variants.nodes.length > 1 ? n.variants.nodes.map((v) => ({ id: v.id, title: v.title, sku: v.sku, available: v.availableForSale, price: Number(v.price.amount) })) : [],
    tryOn: parse(mf.try_on, undefined),
  };
}

export const shopifyProvider: CommerceProvider = {
  name: "shopify",
  async getProducts(query) {
    const data = await storefront<{ products: { nodes: SNode[] } }>(`query { products(first: 100) { nodes { ${PRODUCT_FIELDS} } } }`);
    return applyQuery(data.products.nodes.map(map), query);
  },
  async getProduct(handle) {
    const data = await storefront<{ product: SNode | null }>(`query($h: String!) { product(handle: $h) { ${PRODUCT_FIELDS} } }`, { h: handle });
    return data.product ? map(data.product) : null;
  },
  async getCategories() { return taxonomy.categories; },
  async getOccasions() { return taxonomy.occasions; },
  async getCollections() { return taxonomy.collections; },
  async createHostedCheckout(lines: CartLineInput[]) {
    const products = await Promise.all(lines.map((l) => this.getProduct(l.handle)));
    const cartLines = lines.map((l, i) => {
      const p = products[i];
      const merchandiseId = l.variantId?.startsWith("gid://") ? l.variantId : undefined;
      if (!p) throw new Error(`Unknown product ${l.handle}`);
      return { merchandiseId: merchandiseId ?? (p.variants[0]?.id || p.id), quantity: l.quantity };
    });
    const data = await storefront<{ cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } }>(
      `mutation($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { cart { checkoutUrl } userErrors { message } } }`,
      { lines: cartLines },
    );
    if (!data.cartCreate.cart) throw new Error(data.cartCreate.userErrors.map((e) => e.message).join("; "));
    return { url: data.cartCreate.cart.checkoutUrl };
  },
};
