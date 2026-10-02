import "server-only";
import { commerce } from "@/lib/commerce";
import { getArtists } from "@/lib/content";
import type { CampaignTile } from "@/components/product/EditorialGrid";

export const QUOTES = [
  "“I never wanted a piece to match an outfit. I wanted it to match a mood.”",
  "“The best students were never symmetrical. Neither is good jewellery.”",
  "“If you can’t tell me who made it, I don’t want to sell it.”",
];

export async function shopData() {
  const [products, categories, occasions, collections, artists] = await Promise.all([
    commerce.getProducts(), commerce.getCategories(), commerce.getOccasions(), commerce.getCollections(), getArtists(),
  ]);
  const campaigns: CampaignTile[] = occasions.map((o) => ({
    image: o.image?.src ?? "/art/campaign/hero.svg", alt: o.image?.alt ?? o.name, eyebrow: o.label ?? "Campaign",
    title: o.name, line: o.line, href: `/shop/${o.slug}`, tone: o.tone === "dusk" || o.tone === "festive" ? "dark" : "light",
  }));
  return { products, categories, occasions, collections, artists, campaigns };
}
