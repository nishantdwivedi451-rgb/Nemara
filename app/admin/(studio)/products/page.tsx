import Link from "next/link";
import { loadCatalogueFresh } from "@/lib/catalogue";
import taxonomy from "@/content/taxonomy.json";
import { setProductStatus } from "@/app/admin/actions";
import { PageHead, inr, Empty } from "@/components/admin/ui";

export const metadata = { title: "Products" };

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const { q, cat } = await searchParams;
  const all = await loadCatalogueFresh();
  let list = cat ? all.filter((p) => p.category === cat) : all;
  if (q) { const t = q.toLowerCase(); list = list.filter((p) => `${p.name} ${p.sku} ${p.tags.join(" ")}`.toLowerCase().includes(t)); }
  const catName = (s: string) => taxonomy.categories.find((c) => c.slug === s)?.name ?? s;
  return (
    <>
      <PageHead title="Products" sub={`${all.length} designs · ${all.filter((p) => p.status === "draft").length} drafts`} actions={<><a className="a-btn" href="/api/admin/export/products">Export CSV</a><Link className="a-btn a-btn--primary" href="/admin/products/new">Add a design</Link></>} />
      <div className="a-filters">
        <Link href="/admin/products" className={!cat ? "is-on" : undefined}>All</Link>
        {taxonomy.categories.map((c) => <Link key={c.slug} href={`/admin/products?cat=${c.slug}`} className={cat === c.slug ? "is-on" : undefined}>{c.name}</Link>)}
        <form className="a-search"><input name="q" defaultValue={q} placeholder="Search name, SKU, tag" className="a-input" /></form>
      </div>
      <section className="a-card a-card--flush">
        {list.length === 0 ? <Empty title="No designs match" /> : (
          <div className="a-scroll"><table className="a-table">
            <thead><tr><th /><th>Design</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Status</th><th /></tr></thead>
            <tbody>{list.map((p) => (
              <tr key={p.handle}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <td className="a-thumb"><img src={p.images[0]?.src} alt="" loading="lazy" /></td>
                <td><Link href={`/admin/products/${p.handle}`}><b>{p.name}</b></Link><small>{p.sku}{p.exclusive ? " · Circle exclusive" : ""}{p.featured ? " · featured" : ""}</small></td>
                <td>{catName(p.category)}</td>
                <td className="num">{inr(p.price)}</td>
                <td className="num"><span className={p.inventory === 0 ? "a-pill a-pill--cancelled" : p.inventory <= (p.lowStockAt ?? 5) ? "a-pill a-pill--packed" : "a-pill a-pill--delivered"}>{p.inventory}</span></td>
                <td>
                  <form action={setProductStatus.bind(null, p.handle, p.status === "draft" ? "active" : "draft")}>
                    <button className={`a-toggle ${p.status === "draft" ? "" : "is-on"}`} title={p.status === "draft" ? "Publish" : "Unpublish"}>{p.status === "draft" ? "Draft" : "Live"}</button>
                  </form>
                </td>
                <td className="num"><a href={`/product/${p.handle}`} target="_blank" rel="noopener noreferrer" className="a-link">View ↗</a></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
