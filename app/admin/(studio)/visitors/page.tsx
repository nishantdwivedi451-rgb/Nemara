import { getVisitors, getMembers } from "@/lib/admin/data";
import { PageHead, Kpi, when, Empty } from "@/components/admin/ui";

export const metadata = { title: "Visitors" };

export default async function Visitors() {
  const [visitors, members] = await Promise.all([getVisitors(1000), getMembers()]);
  const memberByVisitor = new Map(members.filter((m) => m.visitorId).map((m) => [m.visitorId!, m]));
  const since = Date.now() - 30 * 864e5;
  const recent = visitors.filter((v) => +new Date(v.engagedAt) >= since);
  const tally = (f: (v: (typeof visitors)[number]) => string | undefined) => Object.entries(recent.reduce<Record<string, number>>((a, v) => { const k = f(v) || "Direct"; a[k] = (a[k] ?? 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const host = (r?: string) => { try { return r ? new URL(r).hostname.replace(/^www\./, "") : undefined; } catch { return undefined; } };
  const source = (v: (typeof visitors)[number]) => v.utm?.utm_source ?? host(v.referrer);
  const converted = recent.filter((v) => memberByVisitor.has(v.visitorId)).length;
  return (
    <>
      <PageHead title="Visitors" sub="Engaged sessions — visitors who stayed 15 seconds or longer" actions={<a className="a-btn" href="/api/admin/export/visitors">Export CSV</a>} />
      <section className="a-kpis">
        <Kpi label="Engaged sessions (30d)" value={String(recent.length)} />
        <Kpi label="Returning" value={`${recent.length ? Math.round((recent.filter((v) => v.returning).length / recent.length) * 100) : 0}%`} />
        <Kpi label="Mobile" value={`${recent.length ? Math.round((recent.filter((v) => v.device === "mobile").length / recent.length) * 100) : 0}%`} />
        <Kpi label="Joined the Circle" value={String(converted)} hint={recent.length ? `${((converted / recent.length) * 100).toFixed(1)}% of sessions` : undefined} />
      </section>
      <div className="a-grid2">
        <section className="a-card"><div className="a-card__head"><h2>Top sources</h2></div><ul className="a-list">{tally(source).map(([k, n]) => <li key={k}><span>{k}</span><b>{n}</b></li>)}</ul></section>
        <section className="a-card"><div className="a-card__head"><h2>Top cities</h2></div><ul className="a-list">{tally((v) => v.city).map(([k, n]) => <li key={k}><span>{k === "Direct" ? "Unknown" : k}</span><b>{n}</b></li>)}</ul></section>
      </div>
      <section className="a-card a-card--flush">
        {visitors.length === 0 ? <Empty title="No engaged visitors yet" body="Sessions are recorded once a visitor has spent 15 seconds on the site." /> : (
          <div className="a-scroll"><table className="a-table">
            <thead><tr><th>When</th><th>Landing page</th><th>Pages</th><th>Source</th><th>Device</th><th>Location</th><th>Circle</th></tr></thead>
            <tbody>{visitors.slice(0, 200).map((v) => {
              const m = memberByVisitor.get(v.visitorId);
              return (
                <tr key={v.id}>
                  <td>{when(v.engagedAt)}{v.returning && <small>returning</small>}</td>
                  <td className="a-mono a-trunc" title={v.landing}>{v.landing}</td>
                  <td className="num" title={v.pages.join("\n")}>{v.pages.length}</td>
                  <td>{source(v) ?? "Direct"}{v.utm?.utm_campaign && <small>{v.utm.utm_campaign}</small>}</td>
                  <td>{v.device}<small>{v.browser}</small></td>
                  <td>{[v.city, v.country].filter(Boolean).join(", ") || "—"}</td>
                  <td>{m ? <span className="a-pill a-pill--paid" title={m.name}>{m.code}</span> : <span className="a-muted">—</span>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </section>
      <p className="a-hint">Contact details are only captured when a visitor chooses to join the Circle (with consent). Anonymous sessions show behaviour, never identity.</p>
    </>
  );
}
