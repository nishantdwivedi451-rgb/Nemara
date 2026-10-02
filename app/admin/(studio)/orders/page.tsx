import Link from "next/link";
import { getOrders } from "@/lib/admin/data";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/oms";
import { PageHead, StatusPill, inr, when, Empty } from "@/components/admin/ui";

export const metadata = { title: "Orders" };

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const all = await getOrders();
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, all.filter((o) => o.status === s).length]));
  let list = status ? all.filter((o) => o.status === status) : all;
  if (q) { const t = q.toLowerCase(); list = list.filter((o) => [o.reference, o.customer.name, o.customer.phone, o.customer.email, o.customer.city].join(" ").toLowerCase().includes(t)); }
  return (
    <>
      <PageHead title="Orders" sub={`${all.length} orders`} actions={<a className="a-btn" href="/api/admin/export/orders">Export CSV</a>} />
      <div className="a-filters">
        <Link href="/admin/orders" className={!status ? "is-on" : undefined}>All <b>{all.length}</b></Link>
        {ORDER_STATUSES.filter((s) => s !== "pending_payment").map((s) => <Link key={s} href={`/admin/orders?status=${s}`} className={status === s ? "is-on" : undefined}>{STATUS_LABEL[s as OrderStatus]} <b>{counts[s]}</b></Link>)}
        <form className="a-search"><input name="q" defaultValue={q} placeholder="Search name, phone, order no." className="a-input" />{status && <input type="hidden" name="status" value={status} />}</form>
      </div>
      <section className="a-card a-card--flush">
        {list.length === 0 ? <Empty title="No orders here" body="Paid orders from the storefront appear automatically." /> : (
          <div className="a-scroll"><table className="a-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Items</th><th>Status</th><th className="num">Total</th></tr></thead>
            <tbody>{list.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`}><b>{o.reference}</b></Link>{o.demo && <small className="a-tag">demo</small>}</td>
                <td>{o.customer.name}<small>{o.customer.city} · {o.customer.phone}</small></td>
                <td>{when(o.createdAt)}</td>
                <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td><StatusPill status={o.status} /></td>
                <td className="num">{inr(o.total)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
