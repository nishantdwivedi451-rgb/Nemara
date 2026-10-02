import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialGrid } from "@/components/product/EditorialGrid";
import { TrackOnMount } from "@/components/analytics/AnalyticsScripts";
import { JsonLd } from "@/components/editorial/JsonLd";
import { getArtist, getArtists } from "@/lib/content";
import { commerce } from "@/lib/commerce";
import { breadcrumbLd, pageMeta } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return (await getArtists()).map((a) => ({ slug: a.slug })); }
export async function generateMetadata({ params }: Params) {
  const a = await getArtist((await params).slug);
  return a ? pageMeta({ title: `${a.name} — ${a.craft}`, description: a.summary, path: `/artists/${a.slug}`, image: a.portrait.src }) : {};
}

export default async function ArtistPage({ params }: Params) {
  const { slug } = await params;
  const a = await getArtist(slug);
  if (!a) notFound();
  const [pieces, others] = await Promise.all([commerce.getProducts({ artist: slug }), getArtists()]);
  return (
    <div className="page-enter">
      <TrackOnMount event="artist_story_view" props={{ artist: slug }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Artists", path: "/artists" }, { name: a.name, path: `/artists/${slug}` }]),
        { "@context": "https://schema.org", "@type": "Person", name: a.name, jobTitle: a.craft, homeLocation: a.location, worksFor: { "@type": "Organization", name: "Nemara" } }]} />
      <header className="artist-hero wrap">
        <div className="artist-hero__img arch frame"><Image src={a.portrait.src} alt={a.portrait.alt} fill priority sizes="(min-width: 900px) 40vw, 90vw" unoptimized /></div>
        <div className="artist-hero__copy">
          <nav aria-label="Breadcrumb" className="crumbs"><Link href="/artists">Artists</Link> / <span aria-current="page">{a.name}</span></nav>
          <p className="eyebrow">The hand behind the piece</p>
          <h1 className="display">{a.name}</h1>
          <dl className="artist-facts">
            <div><dt>From</dt><dd>{a.location}</dd></div>
            <div><dt>Craft</dt><dd>{a.craft}</dd></div>
            <div><dt>Practice</dt><dd>{a.yearsOfPractice} years</dd></div>
            <div><dt>For Nemara</dt><dd>{a.contribution}</dd></div>
          </dl>
        </div>
      </header>
      <section className="wrap artist-story">
        {a.quote && <blockquote className="artist-story__quote h1">“{a.quote}”</blockquote>}
        <div className="prose artist-story__body">{a.story.map((p, i) => <p key={i} className={i === 0 ? "dropcap" : ""}>{p}</p>)}</div>
      </section>
      {pieces.length > 0 && (
        <section className="section--tight">
          <div className="wrap section-head"><div><p className="eyebrow">Pieces by {a.name}</p><h2 className="h2">From these hands</h2></div></div>
          <div className="wrap"><EditorialGrid products={pieces} /></div>
        </section>
      )}
      <section className="wrap section--tight others">
        <p className="eyebrow">More hands</p>
        <ul className="others__list">{others.filter((o) => o.slug !== slug).map((o) => <li key={o.slug}><Link href={`/artists/${o.slug}`} className="h3">{o.name}<span className="muted"> — {o.craft}</span></Link></li>)}</ul>
      </section>
    </div>
  );
}
