import Link from "next/link";
import { loadCatalogueFresh, type StockMove } from "@/lib/catalogue";
import { adjustInventory } from "@/app/admin/actions";
import { store } from "@/lib/store";
import { PageHead, inr, when, Empty } from "@/components/admin/ui";

export const metadata = { title: "Inventory" };

export default async function Inventory({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const [all, moves] = await Promise.all([loadCatalogueFresh(), store().list<StockMove>("stock_moves", { limit: 30 })]);
  const low = (p: (typeof all)[number]) => p.inventory <= (p.lowStockAt ?? 5);
  const list = filter === "low" ? all.filter(low) : filter === "out" ? all.filter((p) => p.inventory === 0) : all;
  const units = all.reduce((n, p) => n + p.inventory, 0);
  const value = all.reduce((n, p) => n + p.inventory * p.price, 0);
  return (
    <>
      <PageHead title="Inventory" sub={`${units} pieces in stock · ${inr(value)} at retail`} actions={<a className="a-btn" href="/api/admin/export/inventory">Export CSV</a>} />
      <div className="a-filters">
        <Link href="/admin/inventory" className={!filter ? "is-on" : undefined}>All <b>{all.length}</b></Link>
        <Link href="/admin/inventory?filter=low" className={filter === "low" ? "is-on" : undefined}>Low stock <b>{all.filter(low).length}</b></Link>
        <Link href="/admin/inventory?filter=out" className={filter === "out" ? "is-on" : undefined}>Sold out <b>{all.filter((p) => p.inventory === 0).length}</b></Link>
      </div>
      <section className="a-card a-card--flush">
        <div className="a-scroll"><table className="a-table">
          <thead><tr><th>Design</th><th className="num">In stock</th><th>Adjust</th></tr></thead>
          <tbody>{list.map((p) => (
            <tr key={p.handle}>
              <td><Link href={`/admin/products/${p.handle}`}><b>{p.name}</b></Link><small>{p.sku} · alert at {p.lowStockAt ?? 5}</small></td>
              <td className="num"><span className={p.inventory === 0 ? "a-pill a-pill--cancelled" : low(p) ? "a-pill a-pill--packed" : "a-pill a-pill--delivered"}>{p.inventory}</span></td>
              <td>
                <form action={adjustInventory} className="a-adjust">
                  <input type="hidden" name="handle" value={p.handle} />
                  <select name="mode" className="a-input" aria-label="Adjustment type"><option value="add">Add / remove</option><option value="set">Set count to</option></select>
                  <input name="qty" type="number" className="a-input" placeholder="e.g. 10 or -2" aria-label="Quantity" required />
                  <input name="reason" className="a-input" placeholder="Reason (restock, damaged…)" aria-label="Reason" />
                  <button className="a-btn a-btn--sm">Apply</button>
                </form>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
      <section className="a-card">
        <div className="a-card__head"><h2>Recent stock movements</h2></div>
        {moves.items.length === 0 ? <Empty title="No movements yet" body="Sales, restocks and adjustments are logged here." /> : (
          <table className="a-table"><tbody>{moves.items.map((m, i) => (
            <tr key={m.id ?? i}><td>{m.sku}<small>{m.reason}{m.ref ? ` · ${m.ref}` : ""}</small></td><td className={`num ${m.delta < 0 ? "a-neg" : "a-pos"}`}>{m.delta > 0 ? "+" : ""}{m.delta}</td><td className="num">→ {m.after}</td><td>{when(m.at)}<small>{m.by}</small></td></tr>
          ))}</tbody></table>
        )}
      </section>
    </>
  );
}
