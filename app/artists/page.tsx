import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/editorial/Reveal";
import { getArtists } from "@/lib/content";
import { commerce } from "@/lib/commerce";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "The Hand Behind the Piece", description: "Meet the Indian artists who make Nemara — filigree, meenakari, repoussé and brass — credited by name on every piece.", path: "/artists" });

export default async function ArtistsPage() {
  const [artists, products] = await Promise.all([getArtists(), commerce.getProducts()]);
  return (
    <div className="page-enter">
      <header className="wrap page-head">
        <p className="eyebrow edition"><b>✋</b> Artists</p>
        <h1 className="display">The hand<br /><em>behind the piece.</em></h1>
        <p className="lede">Nemara doesn&apos;t say “handcrafted by artisans” and leave it there. Every piece names the person who made it, where they work and what their hands contributed.</p>
      </header>
      <div className="wrap artists-list">
        {artists.map((a, i) => {
          const count = products.filter((p) => p.artist === a.slug).length;
          return (
            <Reveal key={a.slug} as="article" className={`reveal artist-feature ${i % 2 ? "is-flip" : ""}`}>
              <Link href={`/artists/${a.slug}`} className="artist-feature__img arch frame"><Image src={a.portrait.src} alt={a.portrait.alt} fill sizes="(min-width: 900px) 40vw, 90vw" unoptimized /></Link>
              <div className="artist-feature__copy">
                <p className="eyebrow">{String(i + 1).padStart(2, "0")} · {a.location}</p>
                <h2 className="h1"><Link href={`/artists/${a.slug}`}>{a.name}</Link></h2>
                <p className="muted">{a.craft} · {a.yearsOfPractice} years</p>
                <p className="lede">{a.summary}</p>
                {a.quote && <blockquote className="pull">“{a.quote}”</blockquote>}
                <Link href={`/artists/${a.slug}`} className="link-arrow">Read the story · {count} pieces</Link>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
