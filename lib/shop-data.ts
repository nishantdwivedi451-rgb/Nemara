import "server-only";
import { commerce } from "@/lib/commerce";
import { getMarkets } from "@/lib/content";
import type { CampaignTile } from "@/components/product/EditorialGrid";

export const QUOTES = [
  "“Match the mood, not the outfit.”",
  "“One in fifty pieces we find in a market makes it to Nemara.”",
  "“Premium, not precious — the best jewellery is the one you actually wear.”",
];

export async function shopData() {
  const [products, categories, occasions, collections, markets] = await Promise.all([
    commerce.getProducts(), commerce.getCategories(), commerce.getOccasions(), commerce.getCollections(), getMarkets(),
  ]);
  const campaigns: CampaignTile[] = occasions.map((o) => ({
    image: o.image?.src ?? "/art/campaign/hero.svg", alt: o.image?.alt ?? o.name, eyebrow: o.label ?? "Campaign",
    title: o.name, line: o.line, href: `/shop/${o.slug}`, tone: o.tone === "dusk" || o.tone === "festive" ? "dark" : "light",
  }));
  return { products, categories, occasions, collections, markets, campaigns };
}
