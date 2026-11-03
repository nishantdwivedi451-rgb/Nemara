import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialGrid } from "@/components/product/EditorialGrid";
import { TrackOnMount } from "@/components/analytics/AnalyticsScripts";
import { JsonLd } from "@/components/editorial/JsonLd";
import { getMarket, getMarkets } from "@/lib/content";
import { commerce } from "@/lib/commerce";
import { breadcrumbLd, pageMeta } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return (await getMarkets()).map((m) => ({ slug: m.slug })); }
export async function generateMetadata({ params }: Params) {
  const m = await getMarket((await params).slug);
  return m ? pageMeta({ title: `${m.city} — ${m.market}`, description: m.summary, path: `/markets/${m.slug}`, image: m.image.src }) : {};
}

export default async function MarketPage({ params }: Params) {
  const { slug } = await params;
  const m = await getMarket(slug);
  if (!m) notFound();
  const [pieces, others] = await Promise.all([commerce.getProducts({ market: slug }), getMarkets()]);
  return (
    <div className="page-enter">
      <TrackOnMount event="market_story_view" props={{ market: slug }} />
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Markets", path: "/markets" }, { name: m.city, path: `/markets/${slug}` }])]} />
      <header className="market-hero wrap">
        <div className="market-hero__img"><Image src={m.image.src} alt={m.image.alt} fill priority sizes="(min-width: 900px) 40vw, 90vw" unoptimized /></div>
        <div className="market-hero__copy">
          <nav aria-label="Breadcrumb" className="crumbs"><Link href="/markets">Markets</Link> / <span aria-current="page">{m.city}</span></nav>
          <p className="eyebrow">Handpicked in {m.city}</p>
          <h1 className="display">{m.city}</h1>
          <p className="lede">{m.lead}</p>
          <dl className="market-facts">
            <div><dt>The market</dt><dd>{m.market}</dd></div>
            <div><dt>Known for</dt><dd>{m.signature}</dd></div>
            <div><dt>Wear it now</dt><dd>{m.wearIt}</dd></div>
            <div><dt>Market tip</dt><dd>{m.tip}</dd></div>
          </dl>
        </div>
      </header>
      <section className="wrap market-story">
        <div>
          <p className="eyebrow">What our buyers look for</p>
          <ul className="market-check">{m.lookFor.map((l) => <li key={l}>{l}</li>)}</ul>
        </div>
        <div className="prose market-story__body">{m.story.map((p, i) => <p key={i} className={i === 0 ? "dropcap" : ""}>{p}</p>)}</div>
      </section>
      {pieces.length > 0 && (
        <section className="section--tight">
          <div className="wrap section-head"><div><p className="eyebrow">Handpicked in {m.city}</p><h2 className="h2">The {m.city} edit</h2></div></div>
          <div className="wrap"><EditorialGrid products={pieces} /></div>
        </section>
      )}
      <section className="wrap section--tight others">
        <p className="eyebrow">More markets</p>
        <ul className="others__list">{others.filter((o) => o.slug !== slug).map((o) => <li key={o.slug}><Link href={`/markets/${o.slug}`} className="h3">{o.city}<span className="muted"> — {o.signature}</span></Link></li>)}</ul>
      </section>
    </div>
  );
}
