import { getMembers, upcomingBirthdays, upcomingFestivals, abandonedCheckouts, waLink } from "@/lib/admin/data";
import { getMarketingSettingsFresh, fillTemplate } from "@/lib/marketing";
import { markContacted, saveMarketing } from "@/app/admin/actions";
import { PageHead, Kpi, inr, day, when, Empty } from "@/components/admin/ui";

export const metadata = { title: "Marketing" };

export default async function Marketing() {
  const [members, s, abandoned] = await Promise.all([getMembers(), getMarketingSettingsFresh(), abandonedCheckouts()]);
  const year = new Date().getFullYear();
  const bdays = upcomingBirthdays(members, 30);
  const fests = upcomingFestivals(s.festivals, 60);
  const first = (n: string) => n.split(" ")[0];
  const month = members.filter((m) => +new Date(m.createdAt) >= Date.now() - 30 * 864e5).length;
  return (
    <>
      <PageHead title="Marketing" sub="Nemara Circle, birthday & festival gifting, and recovery" actions={<a className="a-btn" href="/api/admin/export/members">Export members CSV</a>} />
      <section className="a-kpis">
        <Kpi label="Circle members" value={String(members.length)} hint={`+${month} in 30 days`} />
        <Kpi label="Birthdays (30 days)" value={String(bdays.length)} />
        <Kpi label="Festivals (60 days)" value={String(fests.length)} />
        <Kpi label="Abandoned checkouts" value={String(abandoned.length)} hint="last 14 days" />
      </section>

      <section className="a-card">
        <div className="a-card__head"><h2>Birthday hampers — next 30 days</h2><small className="a-muted">Message, then mark as sent so nobody is contacted twice</small></div>
        {bdays.length === 0 ? <Empty title="No member birthdays in the next 30 days" /> : (
          <div className="a-scroll"><table className="a-table"><tbody>{bdays.map(({ member: m, date, inDays }) => {
            const key = `bday-${date.getFullYear()}`, sent = m.contacted?.[key];
            return (
              <tr key={m.id}>
                <td><b>{m.name}</b><small>{m.code} · {m.city ?? ""}</small></td>
                <td>{inDays === 0 ? <span className="a-pill a-pill--paid">Today 🎉</span> : `${day(date.toISOString())} · in ${inDays}d`}</td>
                <td><a className="a-link" href={waLink(m.phone, fillTemplate(s.birthdayMessage, { name: first(m.name) }))} target="_blank" rel="noopener noreferrer">WhatsApp</a> · <a className="a-link" href={`mailto:${m.email}?subject=${encodeURIComponent("A birthday gift from Nemara")}&body=${encodeURIComponent(fillTemplate(s.birthdayMessage, { name: first(m.name) }))}`}>Email</a></td>
                <td className="num">{sent ? <span className="a-muted">Sent {day(sent)}</span> : <form action={markContacted.bind(null, m.id, key)}><button className="a-btn a-btn--sm">Mark sent</button></form>}</td>
              </tr>
            );
          })}</tbody></table></div>
        )}
      </section>

      <section className="a-card">
        <div className="a-card__head"><h2>Festival gifting — next 60 days</h2><small className="a-muted">Every Circle member is eligible</small></div>
        {fests.length === 0 ? <Empty title="No festivals in the next 60 days" body="Add dates below." /> : fests.map((f) => {
          const key = `fest-${f.name}-${f.date.slice(0, 4)}`;
          const pending = members.filter((m) => !m.contacted?.[key]);
          return (
            <details key={key} className="a-details">
              <summary><b>{f.name}</b> <span className="a-muted">{day(f.date)} · in {f.inDays} days · {pending.length}/{members.length} to message</span> <a className="a-link" href={`/api/admin/export/members?festival=${encodeURIComponent(key)}`}>Export list</a></summary>
              {pending.length === 0 ? <p className="a-muted">Everyone has been messaged.</p> : (
                <table className="a-table"><tbody>{pending.slice(0, 100).map((m) => (
                  <tr key={m.id}><td>{m.name}<small>{m.phone}</small></td>
                    <td><a className="a-link" href={waLink(m.phone, fillTemplate(s.festivalMessage, { name: first(m.name), festival: f.name }))} target="_blank" rel="noopener noreferrer">WhatsApp</a></td>
                    <td className="num"><form action={markContacted.bind(null, m.id, key)}><button className="a-btn a-btn--sm">Mark sent</button></form></td></tr>
                ))}</tbody></table>
              )}
            </details>
          );
        })}
      </section>

      <section className="a-card">
        <div className="a-card__head"><h2>Abandoned checkouts</h2><small className="a-muted">Started checkout, didn&apos;t pay (1 hour – 14 days ago)</small></div>
        {abandoned.length === 0 ? <Empty title="No abandoned checkouts" /> : (
          <div className="a-scroll"><table className="a-table"><tbody>{abandoned.map((c) => (
            <tr key={c.id}><td><b>{c.customer.name}</b><small>{c.customer.phone} · {c.customer.city}</small></td><td>{c.items.map((i) => i.name).join(", ")}</td><td className="num">{inr(c.total)}</td><td>{when(c.createdAt)}</td>
              <td className="num"><a className="a-link" href={waLink(c.customer.phone, fillTemplate(s.abandonedMessage, { name: first(c.customer.name), items: c.items.map((i) => i.name).join(", ") }))} target="_blank" rel="noopener noreferrer">WhatsApp nudge</a></td></tr>
          ))}</tbody></table></div>
        )}
      </section>

      <form action={saveMarketing} className="a-card a-form">
        <div className="a-card__head"><h2>Circle invitation popup</h2><small className="a-muted">Shown once to engaged visitors; snoozed for 7 days if dismissed</small></div>
        <div className="a-row3">
          <label className="a-check"><input type="checkbox" name="enabled" defaultChecked={s.popup.enabled} /> Popup enabled</label>
          <label className="a-check"><input type="checkbox" name="showExclusives" defaultChecked={s.popup.showExclusives} /> Show exclusive designs</label>
          <label className="a-field"><span>Show after (seconds on site)</span><input type="number" min={5} max={120} name="delaySeconds" defaultValue={s.popup.delaySeconds} className="a-input" /></label>
        </div>
        <div className="a-row2">
          <label className="a-field"><span>Eyebrow</span><input name="eyebrow" defaultValue={s.popup.eyebrow} className="a-input" /></label>
          <label className="a-field"><span>Button</span><input name="cta" defaultValue={s.popup.cta} className="a-input" /></label>
        </div>
        <label className="a-field"><span>Headline</span><input name="title" defaultValue={s.popup.title} className="a-input" /></label>
        <label className="a-field"><span>Body</span><textarea name="body" defaultValue={s.popup.body} rows={2} className="a-input" /></label>
        <label className="a-field"><span>Benefits (one per line)</span><textarea name="benefits" defaultValue={s.popup.benefits.join("\n")} rows={4} className="a-input" /></label>
        <label className="a-field"><span>Consent text (required by India&apos;s DPDP Act — keep it clear)</span><textarea name="consentText" defaultValue={s.popup.consentText} rows={2} className="a-input" /></label>
        <div className="a-card__head"><h2>Messages &amp; festival calendar</h2><small className="a-muted">Use {"{name}"}, {"{festival}"}, {"{items}"}</small></div>
        <label className="a-field"><span>Birthday message</span><textarea name="birthdayMessage" defaultValue={s.birthdayMessage} rows={2} className="a-input" /></label>
        <label className="a-field"><span>Festival message</span><textarea name="festivalMessage" defaultValue={s.festivalMessage} rows={2} className="a-input" /></label>
        <label className="a-field"><span>Abandoned-checkout message</span><textarea name="abandonedMessage" defaultValue={s.abandonedMessage} rows={2} className="a-input" /></label>
        <label className="a-field"><span>Festivals — one per line as YYYY-MM-DD | Name (lunar dates change yearly; please verify)</span><textarea name="festivals" defaultValue={s.festivals.map((f) => `${f.date} | ${f.name}`).join("\n")} rows={8} className="a-input a-mono" /></label>
        <button className="a-btn a-btn--primary">Save marketing settings</button>
        <p className="a-hint">Changes to the popup reach the live site within a minute. {year} dates are pre-filled.</p>
      </form>
    </>
  );
}
