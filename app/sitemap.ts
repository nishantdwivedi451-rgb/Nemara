import type { MetadataRoute } from "next";
import { commerce } from "@/lib/commerce";
import { getArtists, getJournal } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import info from "@/content/info.json";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, cats, occs, cols, artists, journal] = await Promise.all([commerce.getProducts(), commerce.getCategories(), commerce.getOccasions(), commerce.getCollections(), getArtists(), getJournal()]);
  const now = new Date();
  const u = (path: string, priority = 0.6, freq: "daily" | "weekly" | "monthly" = "weekly") => ({ url: `${base}${path}`, lastModified: now, changeFrequency: freq, priority });
  return [
    u("/", 1, "daily"), u("/shop", 0.9, "daily"), u("/our-story", 0.8, "monthly"), u("/artists", 0.8), u("/try-on", 0.7), u("/stylist", 0.6), u("/journal", 0.7), u("/contact", 0.5, "monthly"),
    ...[...cats, ...occs, ...cols].map((t) => u(`/shop/${t.slug}`, 0.8)),
    ...products.map((p) => ({ ...u(`/product/${p.handle}`, 0.9), images: p.images.map((i) => (i.src.startsWith("http") ? i.src : `${base}${i.src}`)) })),
    ...artists.map((a) => u(`/artists/${a.slug}`, 0.7)),
    ...journal.map((j) => u(`/journal/${j.slug}`, 0.6, "monthly")),
    ...Object.keys(info).map((k) => u(`/info/${k}`, 0.3, "monthly")),
  ];
}
