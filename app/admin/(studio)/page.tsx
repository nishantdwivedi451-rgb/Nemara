import Link from "next/link";
import { dashboard, upcomingBirthdays, upcomingFestivals, getMembers } from "@/lib/admin/data";
import { getMarketingSettingsFresh } from "@/lib/marketing";
import { Kpi, PageHead, StatusPill, inr, when, Empty } from "@/components/admin/ui";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const [d, members, mk] = await Promise.all([dashboard(), getMembers(), getMarketingSettingsFresh()]);
  const bdays = upcomingBirthdays(members, 14);
  const fests = upcomingFestivals(mk.festivals, 45);
  const max = Math.max(1, ...d.series.map((s) => s.revenue));
  return (
    <>
      <PageHead title="Overview" sub="The last 30 days at Nemara" actions={<Link className="a-btn a-btn--primary" href="/admin/products/new">Add a design</Link>} />
      <section className="a-kpis">
        <Kpi label="Revenue" value={inr(d.revenue30)} hint={`${d.orders30} paid orders`} />
        <Kpi label="Average order" value={inr(d.aov)} />
        <Kpi label="To ship" value={String(d.toShip.length)} hint="paid, not yet shipped" />
        <Kpi label="Circle members" value={String(d.members)} hint={`+${d.members30} this month`} />
        <Kpi label="Engaged visitors" value={String(d.visitors30)} hint="stayed 15s or longer" />
        <Kpi label="Join rate" value={`${(d.joinRate * 100).toFixed(1)}%`} hint="visitors who joined the Circle" />
      </section>

      <section className="a-card">
        <div className="a-card__head"><h2>Revenue, last 14 days</h2></div>
        <div className="a-bars" role="img" aria-label="Daily revenue for the last 14 days">
          {d.series.map((s) => (
            <div key={s.day} className="a-bars__col" title={`${s.day}: ${inr(s.revenue)}`}>
              <span className="a-bars__bar" style={{ height: `${(s.revenue / max) * 100}%` }} />
              <span className="a-bars__lbl">{new Date(s.day).getDate()}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="a-grid2">
        <section className="a-card">
          <div className="a-card__head"><h2>Recent orders</h2><Link href="/admin/orders">All orders →</Link></div>
          {d.recentOrders.length === 0 ? <Empty title="No orders yet" body="Orders appear here the moment a customer pays." /> : (
            <table className="a-table"><tbody>
              {d.recentOrders.map((o) => (
                <tr key={o.id}><td><Link href={`/admin/orders/${o.id}`}>{o.reference}</Link><small>{o.customer.name}</small></td><td>{when(o.createdAt)}</td><td><StatusPill status={o.status} /></td><td className="num">{inr(o.total)}</td></tr>
              ))}
            </tbody></table>
          )}
        </section>
        <section className="a-card">
          <div className="a-card__head"><h2>Low stock</h2><Link href="/admin/inventory">Inventory →</Link></div>
          {d.lowStock.length === 0 ? <Empty title="Everything is well stocked" /> : (
            <table className="a-table"><tbody>
              {d.lowStock.map((p) => <tr key={p.handle}><td><Link href={`/admin/products/${p.handle}`}>{p.name}</Link><small>{p.sku}</small></td><td className="num"><span className={p.inventory === 0 ? "a-pill a-pill--cancelled" : "a-pill a-pill--packed"}>{p.inventory === 0 ? "Sold out" : `${p.inventory} left`}</span></td></tr>)}
            </tbody></table>
          )}
        </section>
        <section className="a-card">
          <div className="a-card__head"><h2>Birthdays, next 14 days</h2><Link href="/admin/marketing">Marketing →</Link></div>
          {bdays.length === 0 ? <Empty title="No birthdays coming up" /> : (
            <ul className="a-list">{bdays.map((b) => <li key={b.member.id}><span>{b.member.name}</span><span className="a-muted">{b.inDays === 0 ? "Today 🎉" : `in ${b.inDays} days`}</span></li>)}</ul>
          )}
        </section>
        <section className="a-card">
          <div className="a-card__head"><h2>Festivals ahead</h2><Link href="/admin/marketing">Plan gifts →</Link></div>
          {fests.length === 0 ? <Empty title="No festivals in the next 45 days" /> : (
            <ul className="a-list">{fests.map((f) => <li key={f.name + f.date}><span>{f.name}</span><span className="a-muted">{f.inDays === 0 ? "Today" : `in ${f.inDays} days`}</span></li>)}</ul>
          )}
        </section>
      </div>
    </>
  );
}
