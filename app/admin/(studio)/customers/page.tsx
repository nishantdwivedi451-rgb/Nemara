import { customers, waLink } from "@/lib/admin/data";
import { PageHead, inr, day, Empty } from "@/components/admin/ui";

export const metadata = { title: "Customers" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const bday = (b?: string) => (b ? `${Number(b.split("-")[1])} ${MONTHS[Number(b.split("-")[0]) - 1]}` : "—");

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string; seg?: string }> }) {
  const { q, seg } = await searchParams;
  const all = await customers();
  let list = seg === "accounts" ? all.filter((c) => c.registered) : seg === "members" ? all.filter((c) => c.member) : seg === "buyers" ? all.filter((c) => c.orders > 0) : seg === "leads" ? all.filter((c) => c.member && c.orders === 0) : all;
  if (q) { const t = q.toLowerCase(); list = list.filter((c) => `${c.name} ${c.phone} ${c.email} ${c.city ?? ""} ${c.member?.code ?? ""}`.toLowerCase().includes(t)); }
  return (
    <>
      <PageHead title="Customers" sub={`${all.length} people · ${all.filter((c) => c.registered).length} accounts · ${all.filter((c) => c.member).length} Circle members · ${all.filter((c) => c.orders).length} buyers`} actions={<a className="a-btn" href="/api/admin/export/customers">Export CSV</a>} />
      <div className="a-filters">
        {[["", "Everyone"], ["accounts", "Accounts"], ["members", "Circle members"], ["buyers", "Buyers"], ["leads", "Members yet to buy"]].map(([k, l]) => <a key={k} href={k ? `/admin/customers?seg=${k}` : "/admin/customers"} className={(seg ?? "") === k ? "is-on" : undefined}>{l}</a>)}
        <form className="a-search"><input name="q" defaultValue={q} placeholder="Search name, phone, email, code" className="a-input" />{seg && <input type="hidden" name="seg" value={seg} />}</form>
      </div>
      <section className="a-card a-card--flush">
        {list.length === 0 ? <Empty title="No customers yet" body="Circle sign-ups and buyers appear here automatically." /> : (
          <div className="a-scroll"><table className="a-table">
            <thead><tr><th>Name</th><th>Contact</th><th>Circle</th><th>Birthday</th><th className="num">Orders</th><th className="num">Spend</th><th /></tr></thead>
            <tbody>{list.map((c) => (
              <tr key={c.key}>
                <td><b>{c.name}</b><small>{[c.registered ? "Account" : "", c.city].filter(Boolean).join(" · ")}</small></td>
                <td><a href={`tel:${c.phone}`}>{c.phone}</a><small><a href={`mailto:${c.email}`}>{c.email}</a></small></td>
                <td>{c.member ? <><span className="a-pill a-pill--paid">{c.member.code}</span><small>since {day(c.member.createdAt)}</small></> : <span className="a-muted">—</span>}</td>
                <td>{bday(c.birthday)}</td>
                <td className="num">{c.orders}</td>
                <td className="num">{c.spend ? inr(c.spend) : "—"}</td>
                <td className="num"><a className="a-link" href={waLink(c.phone, `Hi ${c.name.split(" ")[0]}, this is Nemara.`)} target="_blank" rel="noopener noreferrer">WhatsApp</a></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </>
  );
}
