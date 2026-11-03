import Image from "next/image";
import Link from "next/link";
import { ProductCard, type CardProduct } from "./ProductCard";
import type { Market } from "@/lib/commerce/types";

export type CampaignTile = { image: string; alt: string; eyebrow: string; title: string; line: string; href: string; tone?: "dark" | "light" };

/**
 * Editorial merchandising: products are paginated like a magazine, in full rows,
 * interrupted by campaign spreads, market stories and style notes.
 */
type Row = { kind: "products"; size: number; span: number } | { kind: "campaign" | "quote" } | { kind: "market" };
const ROWS: Row[] = [
  { kind: "products", size: 2, span: 6 }, { kind: "campaign" }, { kind: "products", size: 3, span: 4 },
  { kind: "market" }, { kind: "quote" }, { kind: "products", size: 4, span: 3 }, { kind: "products", size: 3, span: 4 },
];
const SPAN_FOR_COUNT: Record<number, number> = { 1: 6, 2: 6, 3: 4, 4: 3 };

export function EditorialGrid({ products, campaigns = [], markets = [], quotes = [] }:
  { products: CardProduct[]; campaigns?: CampaignTile[]; markets?: Market[]; quotes?: string[] }) {
  const tiles: React.ReactNode[] = [];
  let i = 0, c = 0, a = 0, q = 0, step = 0;
  const card = (p: CardProduct, span: number) =>
    <div key={p.handle} className={`egrid__item span-${span}`}><ProductCard p={p} size={span === 6 ? "lg" : "md"} priority={i <= 2} /></div>;
  while (i < products.length && step < 200) {
    const row = ROWS[step % ROWS.length];
    step++;
    const remaining = products.length - i;
    if (row.kind === "products") {
      const take = Math.min(row.size, remaining);
      const span = take === row.size ? row.span : SPAN_FOR_COUNT[take];
      for (let k = 0; k < take; k++) tiles.push(card(products[i++], span));
    } else if (row.kind === "campaign") {
      const t = campaigns[c++ % Math.max(1, campaigns.length)];
      if (t && remaining > 1) tiles.push(
        <Link key={`c${step}`} href={t.href} className={`etile etile--campaign ${t.tone === "dark" ? "is-dark" : ""}`}>
          <div className="etile__img frame"><Image src={t.image} alt={t.alt} fill sizes="(min-width: 900px) 55vw, 100vw" unoptimized /></div>
          <div className="etile__copy"><p className="eyebrow">{t.eyebrow}</p><h3 className="h1">{t.title}</h3><p>{t.line}</p><span className="link-arrow">Shop the moment</span></div>
        </Link>);
    } else if (row.kind === "market") {
      const mk = markets[a++ % Math.max(1, markets.length)];
      if (mk && remaining >= 1) {
        tiles.push(
          <Link key={`a${step}`} href={`/markets/${mk.slug}`} className="etile etile--market">
            <div className="etile__portrait etile__portrait--market"><Image src={mk.image.src} alt={mk.image.alt} fill sizes="(min-width: 900px) 30vw, 60vw" unoptimized /></div>
            <div className="etile__copy">
              <p className="eyebrow">Handpicked in {mk.city}</p>
              <h3 className="h2">{mk.market}</h3>
              <p className="muted">Known for {mk.signature.toLowerCase()}</p>
              <blockquote className="etile__quote">“{mk.tip}”</blockquote>
              <span className="link-arrow">Explore {mk.city}</span>
            </div>
          </Link>);
        tiles.push(card(products[i++], 4));
      }
    } else if (row.kind === "quote") {
      const text = quotes[q++ % Math.max(1, quotes.length)];
      if (text && remaining > 1) tiles.push(<div key={`q${step}`} className="etile etile--quote"><p className="etile__q">{text}</p><span className="eyebrow">The Nemara edit</span></div>);
    }
  }
  return <div className="egrid">{tiles}</div>;
}
