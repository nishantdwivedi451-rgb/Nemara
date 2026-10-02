import artists from "@/content/artists.json";
import journal from "@/content/journal.json";
import type { Artist } from "@/lib/commerce/types";

// Editorial content source. Swap these functions for a headless CMS (Sanity, Contentful,
// Shopify metaobjects…) without touching any page — see docs/ARCHITECTURE.md.

export type JournalBlock = { type: "p" | "quote" | "h"; text: string };
export type JournalEntry = (typeof journal)[number] & { body: JournalBlock[] };

export async function getArtists(): Promise<Artist[]> { return artists; }
export async function getArtist(slug: string): Promise<Artist | null> { return artists.find((a) => a.slug === slug) ?? null; }
export async function getJournal(): Promise<JournalEntry[]> {
  return (journal as JournalEntry[]).slice().sort((a, b) => b.date.localeCompare(a.date));
}
export async function getJournalEntry(slug: string): Promise<JournalEntry | null> {
  return (journal as JournalEntry[]).find((j) => j.slug === slug) ?? null;
}
