import { Suspense } from "react";
import { ShopExplorer } from "@/components/shop/ShopExplorer";
import { shopData, QUOTES } from "@/lib/shop-data";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Shop all pieces", description: "Necklace sets, earrings, bracelets and kadas — each designed by Pratima Saxena and made by a named Indian artist.", path: "/shop" });

export default async function ShopPage() {
  const d = await shopData();
  return (
    <div className="page-enter">
      <header className="shop-hero wrap">
        <p className="eyebrow edition"><b>№</b> The catalogue · {d.products.length} pieces</p>
        <h1 className="display shop-hero__title">The <em>Edition</em></h1>
        <p className="lede">Every piece here was drawn by hand, made by someone we can name, and shown on the body — so you know how it will feel to wear.</p>
      </header>
      <Suspense fallback={<div className="wrap muted">Loading the edition…</div>}>
        <ShopExplorer products={d.products} categories={d.categories} occasions={d.occasions} campaigns={d.campaigns} artists={d.artists} quotes={QUOTES} />
      </Suspense>
    </div>
  );
}
