"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EditorialGrid, type CampaignTile } from "@/components/product/EditorialGrid";
import { applyQuery } from "@/lib/commerce/query";
import { IconClose } from "@/components/brand/Icons";
import { cx } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { Artist, Product, SortKey, Taxon } from "@/lib/commerce/types";

const PRICES = [
  { id: "u2", label: "Under ₹2,000", test: (p: number) => p < 2000 },
  { id: "2-4", label: "₹2,000 – ₹4,000", test: (p: number) => p >= 2000 && p <= 4000 },
  { id: "4p", label: "Over ₹4,000", test: (p: number) => p > 4000 },
];
const SORTS: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Editor’s order" }, { id: "newest", label: "Newest" }, { id: "price-asc", label: "Price, low to high" }, { id: "price-desc", label: "Price, high to low" },
];

type Props = {
  products: Product[];
  categories: Taxon[];
  occasions: Taxon[];
  campaigns: CampaignTile[];
  artists: Artist[];
  quotes: string[];
  lock?: { type: "category" | "occasion" | "collection"; slug: string };
};

export function ShopExplorer({ products, categories, occasions, campaigns, artists, quotes, lock }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [sheet, setSheet] = useState(false);

  const f = {
    q: sp.get("q") ?? "",
    category: lock?.type === "category" ? lock.slug : sp.get("category") ?? "",
    occasion: lock?.type === "occasion" ? lock.slug : sp.get("occasion") ?? "",
    price: sp.get("price") ?? "",
    tryon: sp.get("tryon") === "1",
    sort: (sp.get("sort") as SortKey) || "featured",
  };

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const list = useMemo(() => {
    let l = applyQuery(products, { q: f.q || undefined, category: f.category || undefined, occasion: f.occasion || undefined, collection: lock?.type === "collection" ? lock.slug : undefined, sort: f.sort });
    const pr = PRICES.find((p) => p.id === f.price);
    if (pr) l = l.filter((p) => pr.test(p.price));
    if (f.tryon) l = l.filter((p) => p.tryOn?.supported);
    return l;
  }, [products, f.q, f.category, f.occasion, f.price, f.tryon, f.sort, lock]);

  useEffect(() => { if (f.q) track("search", { search_term: f.q, results: list.length, placement: "shop" }); }, [f.q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.body.style.overflow = sheet ? "hidden" : ""; }, [sheet]);

  const activeCount = [f.category && lock?.type !== "category", f.occasion && lock?.type !== "occasion", f.price, f.tryon].filter(Boolean).length;
  const chip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} className={cx("chip", on && "is-on")} aria-pressed={on} onClick={onClick}>{label}</button>
  );

  const Filters = (
    <>
      {lock?.type !== "category" && (
        <fieldset className="filters__group"><legend className="eyebrow">Piece</legend><div className="chips">
          {categories.map((c) => chip(f.category === c.slug, c.name, () => set({ category: f.category === c.slug ? null : c.slug })))}
        </div></fieldset>
      )}
      {lock?.type !== "occasion" && (
        <fieldset className="filters__group"><legend className="eyebrow">Moment</legend><div className="chips">
          {occasions.map((o) => chip(f.occasion === o.slug, o.name, () => set({ occasion: f.occasion === o.slug ? null : o.slug })))}
        </div></fieldset>
      )}
      <fieldset className="filters__group"><legend className="eyebrow">Price</legend><div className="chips">
        {PRICES.map((p) => chip(f.price === p.id, p.label, () => set({ price: f.price === p.id ? null : p.id })))}
      </div></fieldset>
      <fieldset className="filters__group"><legend className="eyebrow">Experience</legend><div className="chips">
        {chip(f.tryon, "Try-on ready", () => set({ tryon: f.tryon ? null : "1" }))}
      </div></fieldset>
    </>
  );

  return (
    <div className="shop">
      <div className="shop__bar wrap">
        <div className="shop__bar-left">
          <button className="btn btn--ghost btn--sm mobile-only" onClick={() => setSheet(true)} aria-expanded={sheet}>Filter{activeCount ? ` · ${activeCount}` : ""}</button>
          <div className="desktop-only shop__quick">
            {lock?.type !== "category" && categories.map((c) => chip(f.category === c.slug, c.name, () => set({ category: f.category === c.slug ? null : c.slug })))}
            {lock?.type === "category" && occasions.map((o) => chip(f.occasion === o.slug, o.name, () => set({ occasion: f.occasion === o.slug ? null : o.slug })))}
            <button className="chip chip--more" onClick={() => setSheet(true)}>More filters{activeCount ? ` · ${activeCount}` : ""}</button>
          </div>
        </div>
        <div className="shop__bar-right">
          <span className="muted shop__count" aria-live="polite">{list.length} {list.length === 1 ? "piece" : "pieces"}</span>
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" className="shop__sort" value={f.sort} onChange={(e) => set({ sort: e.target.value === "featured" ? null : e.target.value })}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {f.q && (
        <div className="wrap shop__query">
          <p>Results for <span className="underline-ink">“{f.q}”</span></p>
          <button className="text-link muted" onClick={() => set({ q: null })}>Clear search</button>
        </div>
      )}

      <div className="wrap">
        {list.length === 0 ? (
          <div className="empty empty--page">
            <p className="hand">nothing fits — yet.</p>
            <p className="muted">Try removing a filter, or tell the Nemara Stylist what you are looking for.</p>
            <div className="empty__ctas">
              <button className="btn btn--ghost" onClick={() => router.replace(pathname)}>Clear filters</button>
              <a className="btn" href={`/stylist${f.q ? `?q=${encodeURIComponent(f.q)}` : ""}`}>Ask the Stylist</a>
            </div>
          </div>
        ) : (
          <EditorialGrid products={list} campaigns={campaigns} artists={artists} quotes={quotes} />
        )}
      </div>

      <div className={`drawer-scrim ${sheet ? "is-open" : ""}`} onClick={() => setSheet(false)} />
      <aside className={`filters-sheet ${sheet ? "is-open" : ""}`} aria-label="Filters" aria-hidden={!sheet}>
        <div className="filters-sheet__head"><h2 className="h3">Refine</h2><button className="icon-btn" onClick={() => setSheet(false)} aria-label="Close filters"><IconClose /></button></div>
        <div className="filters-sheet__body">{Filters}</div>
        <div className="filters-sheet__foot">
          <button className="btn btn--ghost" onClick={() => { router.replace(pathname); }}>Clear</button>
          <button className="btn" onClick={() => setSheet(false)}>Show {list.length}</button>
        </div>
      </aside>
    </div>
  );
}
