import type { Product, ProductQuery } from "./types";

const STOP = new Set(["for", "a", "an", "the", "and", "with", "something", "show", "me", "i", "want", "some"]);
/** Customer language → catalogue language. */
const SYNONYMS: Record<string, string> = {
  office: "nine-to-five", work: "nine-to-five", workwear: "nine-to-five", party: "after-hours", night: "after-hours", cocktail: "after-hours",
  festive: "celebration", wedding: "celebration", diwali: "celebration", daily: "everyday", casual: "everyday",
  gift: "giftable", gifts: "giftable", necklace: "necklace", necklaces: "necklace", bangle: "kada", bangles: "kada", kadas: "kada",
  earring: "earrings", bracelet: "bracelets", jhumkas: "jhumka", hoop: "hoops", silver: "silver", gold: "gold",
};

/** Shared, provider-agnostic filtering/sorting (also used client-side in the shop). */
export function applyQuery(all: Product[], q: ProductQuery = {}): Product[] {
  let list = all.slice();
  if (q.category) list = list.filter((p) => p.category === q.category);
  if (q.occasion) list = list.filter((p) => p.occasions.includes(q.occasion!));
  if (q.collection) list = list.filter((p) => p.collections.includes(q.collection!));
  if (q.artist) list = list.filter((p) => p.artist === q.artist);
  if (q.q) {
    let text = q.q.toLowerCase();
    const max = text.match(/(?:under|below|less than|<)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (max) {
      const cap = Number(max[1].replace(/,/g, ""));
      list = list.filter((p) => p.price <= cap);
      text = text.replace(max[0], " ");
    }
    const terms = text.split(/\s+/).filter((t) => t && !STOP.has(t)).map((t) => SYNONYMS[t] ?? t);
    list = list.filter((p) => {
      const hay = [p.name, p.subtitle, p.description, p.material, p.category, ...p.tags, ...p.occasions, ...p.collections, p.artist].join(" ").toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }
  switch (q.sort) {
    case "newest": list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    case "price-asc": list.sort((a, b) => a.price - b.price); break;
    case "price-desc": list.sort((a, b) => b.price - a.price); break;
    default: list.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
  return q.limit ? list.slice(0, q.limit) : list;
}

export const availabilityOf = (inventory: number) =>
  inventory <= 0 ? "sold_out" : inventory <= 8 ? "low_stock" : "in_stock";
