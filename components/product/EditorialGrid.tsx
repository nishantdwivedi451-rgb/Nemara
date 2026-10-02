import Image from "next/image";
import Link from "next/link";
import { ProductCard, type CardProduct } from "./ProductCard";
import type { Artist } from "@/lib/commerce/types";

export type CampaignTile = { image: string; alt: string; eyebrow: string; title: string; line: string; href: string; tone?: "dark" | "light" };

/**
 * Editorial merchandising: products are paginated like a magazine, interrupted by
 * campaign spreads, artist stories and Pratima's margin notes.
 */
const PATTERN = ["6", "6", "campaign", "4", "4", "4", "artist", "4", "quote", "3", "3", "3", "3"] as const;

export function EditorialGrid({ products, campaigns = [], artists = [], quotes = [] }:
  { products: CardProduct[]; campaigns?: CampaignTile[]; artists?: Artist[]; quotes?: string[] }) {
  const tiles: React.ReactNode[] = [];
  let i = 0, c = 0, a = 0, q = 0, step = 0;
  while (i < products.length) {
    const slot = PATTERN[step % PATTERN.length];
    step++;
    const remaining = products.length - i;
    if (slot === "campaign") {
      const t = campaigns[c++ % Math.max(1, campaigns.length)];
      if (t && remaining > 1) tiles.push(
        <Link key={`c${step}`} href={t.href} className={`etile etile--campaign ${t.tone === "dark" ? "is-dark" : ""}`}>
          <div className="etile__img"><Image src={t.image} alt={t.alt} fill sizes="100vw" unoptimized /></div>
          <div className="etile__copy"><p className="eyebrow">{t.eyebrow}</p><h3 className="h1">{t.title}</h3><p>{t.line}</p><span className="link-arrow">Shop the moment</span></div>
        </Link>);
    } else if (slot === "artist") {
      const ar = artists[a++ % Math.max(1, artists.length)];
      if (ar && remaining > 1) tiles.push(
        <Link key={`a${step}`} href={`/artists/${ar.slug}`} className="etile etile--artist">
          <div className="etile__portrait arch"><Image src={ar.portrait.src} alt={ar.portrait.alt} fill sizes="(min-width: 900px) 30vw, 60vw" unoptimized /></div>
          <div className="etile__copy">
            <p className="eyebrow">The hand behind the piece</p>
            <h3 className="h2">{ar.name}</h3>
            <p className="muted">{ar.craft} · {ar.location}</p>
            {ar.quote && <blockquote className="etile__quote">“{ar.quote}”</blockquote>}
            <span className="link-arrow">Read the story</span>
          </div>
        </Link>);
    } else if (slot === "quote") {
      const text = quotes[q++ % Math.max(1, quotes.length)];
      if (text && remaining > 1) tiles.push(<div key={`q${step}`} className="etile etile--quote"><p className="hand">{text}</p><span className="eyebrow">— Pratima Saxena, founder</span></div>);
    } else {
      const p = products[i++];
      tiles.push(<div key={p.handle} className={`egrid__item span-${slot}`}><ProductCard p={p} size={slot === "6" ? "lg" : "md"} priority={i <= 2} /></div>);
    }
  }
  return <div className="egrid">{tiles}</div>;
}
