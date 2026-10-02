import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder, ORDER_STATUSES, STATUS_LABEL } from "@/lib/oms";
import { updateOrder } from "@/app/admin/actions";
import { waLink } from "@/lib/admin/data";
import { PageHead, StatusPill, inr, when } from "@/components/admin/ui";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const o = await getOrder((await params).id);
  if (!o) notFound();
  const c = o.customer;
  const msg = `Hi ${c.name.split(" ")[0]}, this is Nemara about your order ${o.reference}.` + (o.tracking?.number ? ` It's on its way with ${o.tracking.courier ?? "our courier"} — tracking ${o.tracking.number}${o.tracking.url ? ` (${o.tracking.url})` : ""}.` : "");
  return (
    <>
      <PageHead title={o.reference} sub={`Placed ${when(o.createdAt)} · ${o.gateway}${o.demo ? " (demo)" : ""}`} actions={<><StatusPill status={o.status} /><a className="a-btn" href={waLink(c.phone, msg)} target="_blank" rel="noopener noreferrer">WhatsApp customer</a></>} />
      <Link href="/admin/orders" className="a-back">← All orders</Link>
      <div className="a-grid2 a-grid2--wide">
        <div className="a-stack">
          <section className="a-card">
            <div className="a-card__head"><h2>Items</h2></div>
            <table className="a-table"><tbody>
              {o.items.map((i) => <tr key={i.sku}><td><Link href={`/admin/products/${i.handle}`}>{i.name}</Link><small>{i.sku}{i.variant ? ` · size ${i.variant}` : ""}</small></td><td>× {i.quantity}</td><td className="num">{inr(i.total)}</td></tr>)}
              <tr className="a-table__sum"><td>Subtotal</td><td /><td className="num">{inr(o.subtotal)}</td></tr>
              <tr className="a-table__sum"><td>Shipping</td><td /><td className="num">{o.shipping ? inr(o.shipping) : "Free"}</td></tr>
              <tr className="a-table__total"><td>Total</td><td /><td className="num">{inr(o.total)}</td></tr>
            </tbody></table>
          </section>
          <section className="a-card">
            <div className="a-card__head"><h2>Update order</h2></div>
            <form action={updateOrder} className="a-form">
              <input type="hidden" name="id" value={o.id} />
              <div className="a-row3">
                <label className="a-field"><span>Status</span><select name="status" defaultValue={o.status} className="a-input">{ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></label>
                <label className="a-field"><span>Courier</span><input name="courier" defaultValue={o.tracking?.courier} className="a-input" placeholder="Delhivery, Blue Dart…" /></label>
                <label className="a-field"><span>Tracking no.</span><input name="trackingNumber" defaultValue={o.tracking?.number} className="a-input" /></label>
              </div>
              <label className="a-field"><span>Tracking link</span><input name="trackingUrl" defaultValue={o.tracking?.url} className="a-input" placeholder="https://" /></label>
              <label className="a-field"><span>Internal note</span><textarea name="note" className="a-input" rows={2} placeholder="Visible only in Studio" /></label>
              <p className="a-hint">Cancelling or refunding an unshipped order returns its pieces to stock automatically.</p>
              <button className="a-btn a-btn--primary">Save changes</button>
            </form>
          </section>
        </div>
        <div className="a-stack">
          <section className="a-card">
            <div className="a-card__head"><h2>Customer</h2></div>
            <dl className="a-dl">
              <div><dt>Name</dt><dd>{c.name}</dd></div>
              <div><dt>Mobile</dt><dd><a href={`tel:${c.phone}`}>{c.phone}</a></dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${c.email}`}>{c.email}</a></dd></div>
              <div><dt>Ship to</dt><dd>{c.line1}{c.line2 ? `, ${c.line2}` : ""}<br />{c.city}, {c.state} {c.pincode}</dd></div>
              {c.gift && <div><dt>Gift</dt><dd>Yes — hide prices, add story card</dd></div>}
              {c.note && <div><dt>Customer note</dt><dd>{c.note}</dd></div>}
              <div><dt>Payment ID</dt><dd className="a-mono">{o.paymentId ?? "—"}</dd></div>
            </dl>
          </section>
          <section className="a-card">
            <div className="a-card__head"><h2>Timeline</h2></div>
            <ol className="a-timeline">
              {[...o.timeline].reverse().map((t, i) => <li key={i}><b>{t.status === "note" ? "Note" : STATUS_LABEL[t.status]}</b>{t.note && <p>{t.note}</p>}<small>{when(t.at)} · {t.by}</small></li>)}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
