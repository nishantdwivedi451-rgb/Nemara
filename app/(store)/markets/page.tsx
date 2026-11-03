import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/editorial/Reveal";
import { getMarkets } from "@/lib/content";
import { commerce } from "@/lib/commerce";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "The Markets — Curated across India", description: "Jaipur's Johari Bazaar, Old Delhi's Dariba Kalan, Srinagar's Lal Chowk, Hyderabad's Laad Bazaar, Colaba Causeway and Law Garden — the markets Nemara handpicks from.", path: "/markets" });

/** Markets we're scouting for upcoming edits. */
const NEXT_STOPS = [
  { city: "Kolkata", market: "Gariahat", signature: "Bengali gold-tone & tribal brass" },
  { city: "Chennai", market: "T. Nagar", signature: "Temple-style sets & pearls" },
  { city: "Lucknow", market: "Aminabad", signature: "Polki-look & chandbalis" },
];

export default async function MarketsPage() {
  const [markets, products] = await Promise.all([getMarkets(), commerce.getProducts()]);
  return (
    <div className="page-enter">
      <header className="wrap page-head">
        <p className="eyebrow">The markets</p>
        <h1 className="display">India is a<br /><em>jewellery box.</em></h1>
        <p className="lede">Every city has a market with its own signature. We walk them season after season — and bring back only the pieces worth wearing.</p>
      </header>
      <div className="wrap markets-list">
        {markets.map((m, i) => {
          const count = products.filter((p) => p.market === m.slug).length;
          return (
            <Reveal key={m.slug} as="article" className={`reveal market-feature ${i % 2 ? "is-flip" : ""}`}>
              <Link href={`/markets/${m.slug}`} className="market-feature__img"><Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width: 900px) 40vw, 90vw" unoptimized /></Link>
              <div className="market-feature__copy">
                <p className="eyebrow">{m.market} · {m.region}</p>
                <h2 className="h1"><Link href={`/markets/${m.slug}`}>{m.city}</Link></h2>
                <p className="muted">Known for {m.signature.toLowerCase()}</p>
                <p className="lede">{m.summary}</p>
                <p className="market-tip"><span className="eyebrow">Market tip</span>{m.tip}</p>
                <Link href={`/markets/${m.slug}`} className="link-arrow">Shop {m.city} · {count} {count === 1 ? "piece" : "pieces"}</Link>
              </div>
            </Reveal>
          );
        })}
      </div>
      <section className="wrap next-stops section--tight" aria-labelledby="next-title">
        <p className="eyebrow">Next on the route</p>
        <h2 id="next-title" className="h2">Where we&apos;re hunting next.</h2>
        <ul className="next-stops__list">
          {NEXT_STOPS.map((s) => <li key={s.city}><span className="h3">{s.city}</span><span className="muted">{s.market} · {s.signature}</span></li>)}
        </ul>
        <p className="muted">Join the Nemara Circle to see these edits before anyone else.</p>
      </section>
    </div>
  );
}
