import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductStory } from "@/components/product/ProductStory";
import { ProductRail } from "@/components/product/ProductRail";
import { JsonLd } from "@/components/editorial/JsonLd";
import { commerce } from "@/lib/commerce";
import { getMarket } from "@/lib/content";
import { SITE } from "@/lib/site";
import { breadcrumbLd, pageMeta, productLd } from "@/lib/seo";

type Params = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  return (await commerce.getProducts()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Params) {
  const p = await commerce.getProduct((await params).handle);
  if (!p) return {};
  return pageMeta({ title: p.seo?.title || `${p.name} — ${p.subtitle ?? ""}`.replace(/ — $/, ""), description: p.seo?.description || p.description, path: `/product/${p.handle}`, image: p.images[1]?.src ?? p.images[0]?.src });
}

export default async function ProductPage({ params }: Params) {
  const { handle } = await params;
  const p = await commerce.getProduct(handle);
  if (!p) notFound();
  const [market, all, occasions, categories] = await Promise.all([getMarket(p.market), commerce.getProducts(), commerce.getOccasions(), commerce.getCategories()]);
  const moment = occasions.find((o) => o.slug === p.occasions[0]);
  const category = categories.find((c) => c.slug === p.category);
  const look = all.filter((x) => x.handle !== p.handle && x.category !== p.category && x.occasions.some((o) => p.occasions.includes(o))).slice(0, 6);
  const fromMarket = all.filter((x) => x.handle !== p.handle && x.market === p.market).slice(0, 6);

  return (
    <div className="page-enter">
      <JsonLd data={[productLd(p, market ? `${market.market}, ${market.city}` : undefined), breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, ...(category ? [{ name: category.name, path: `/shop/${category.slug}` }] : []), { name: p.name, path: `/product/${p.handle}` }])]} />
      <div className="wrap">
        <nav aria-label="Breadcrumb" className="crumbs pdp__crumbs">
          <Link href="/shop">Shop</Link> / {category && <><Link href={`/shop/${category.slug}`}>{category.name}</Link> / </>}<span aria-current="page">{p.name}</span>
        </nav>
      </div>
      <section className="pdp wrap">
        <ProductGallery images={p.images} name={p.name} />
        <BuyBox p={p} market={market} shipping={SITE.shipping} />
      </section>

      <ProductStory p={p} market={market} moment={moment} />

      {look.length > 0 && (
        <section className="section--tight" aria-labelledby="look-title">
          <div className="wrap section-head"><div><p className="eyebrow">Complete the look</p><h2 id="look-title" className="h2">Worn with</h2></div></div>
          <div className="wrap"><ProductRail products={look} label="Complete the look" /></div>
        </section>
      )}
      {market && fromMarket.length > 0 && (
        <section className="section--tight" aria-labelledby="market-more">
          <div className="wrap section-head"><div><p className="eyebrow">Also from {market.city}</p><h2 id="market-more" className="h2">More from {market.market}</h2></div><Link href={`/markets/${market.slug}`} className="link-arrow">The {market.city} edit</Link></div>
          <div className="wrap"><ProductRail products={fromMarket} label={`More from ${market.city}`} /></div>
        </section>
      )}
    </div>
  );
}
