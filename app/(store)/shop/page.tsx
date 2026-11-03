import { Suspense } from "react";
import { ShopExplorer } from "@/components/shop/ShopExplorer";
import { shopData, QUOTES } from "@/lib/shop-data";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Shop all pieces", description: "Necklace sets, earrings, bracelets and kadas — handpicked from India's most loved jewellery markets and checked piece by piece.", path: "/shop" });

export default async function ShopPage() {
  const d = await shopData();
  return (
    <div className="page-enter">
      <header className="shop-hero wrap">
        <p className="eyebrow">The catalogue · {d.products.length} pieces</p>
        <h1 className="display shop-hero__title">The <em>Edition</em></h1>
        <p className="lede">Every piece here was handpicked in one of India&apos;s great jewellery markets, checked piece by piece, and shown on the body — so you know how it will feel to wear.</p>
      </header>
      <Suspense fallback={<div className="wrap muted">Loading the edition…</div>}>
        <ShopExplorer products={d.products} categories={d.categories} occasions={d.occasions} campaigns={d.campaigns} markets={d.markets} quotes={QUOTES} />
      </Suspense>
    </div>
  );
}
