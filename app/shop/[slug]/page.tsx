import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopExplorer } from "@/components/shop/ShopExplorer";
import { JsonLd } from "@/components/editorial/JsonLd";
import { TrackOnMount } from "@/components/analytics/AnalyticsScripts";
import { shopData, QUOTES } from "@/lib/shop-data";
import { commerce } from "@/lib/commerce";
import { breadcrumbLd, pageMeta } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

async function resolve(slug: string) {
  const [cats, occs, cols] = await Promise.all([commerce.getCategories(), commerce.getOccasions(), commerce.getCollections()]);
  const c = cats.find((x) => x.slug === slug); if (c) return { type: "category" as const, t: c };
  const o = occs.find((x) => x.slug === slug); if (o) return { type: "occasion" as const, t: o };
  const k = cols.find((x) => x.slug === slug); if (k) return { type: "collection" as const, t: k };
  return null;
}

export async function generateStaticParams() {
  const [cats, occs, cols] = await Promise.all([commerce.getCategories(), commerce.getOccasions(), commerce.getCollections()]);
  return [...cats, ...occs, ...cols].map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params) {
  const r = await resolve((await params).slug);
  if (!r) return {};
  return pageMeta({ title: r.type === "occasion" ? `${r.t.name} — ${r.t.label}` : r.t.name, description: r.t.line, path: `/shop/${r.t.slug}`, image: r.t.image?.src });
}

export default async function TaxonPage({ params }: Params) {
  const { slug } = await params;
  const r = await resolve(slug);
  if (!r) notFound();
  const d = await shopData();
  const isMoment = r.type === "occasion";
  return (
    <div className="page-enter">
      <TrackOnMount event="view_category" props={{ category: slug, type: r.type }} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: r.t.name, path: `/shop/${slug}` }])} />
      {isMoment && r.t.image ? (
        <header className={`moment-hero moment--${r.t.tone}`}>
          <Image src={r.t.image.src} alt={r.t.image.alt} fill priority sizes="100vw" unoptimized />
          <div className="wrap moment-hero__copy">
            <p className="eyebrow">Choose your moment · {r.t.label}</p>
            <h1 className="display">{r.t.name}</h1>
            <p className="moment-hero__line">{r.t.line}</p>
          </div>
        </header>
      ) : (
        <header className="shop-hero wrap">
          <nav aria-label="Breadcrumb" className="crumbs"><Link href="/shop">Shop</Link> / <span aria-current="page">{r.t.name}</span></nav>
          <h1 className="display shop-hero__title">{r.t.name}</h1>
          <p className="lede">{r.t.line}</p>
        </header>
      )}
      <Suspense fallback={null}>
        <ShopExplorer products={d.products} categories={d.categories} occasions={d.occasions} campaigns={d.campaigns.filter((c) => !c.href.endsWith(slug))} artists={d.artists} quotes={QUOTES} lock={{ type: r.type, slug }} />
      </Suspense>
    </div>
  );
}
