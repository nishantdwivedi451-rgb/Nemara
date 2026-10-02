import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentCustomer } from "@/lib/customers";
import { getOrder, STATUS_LABEL, type OrderStatus } from "@/lib/oms";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track your order", robots: { index: false } };
const STEPS: OrderStatus[] = ["paid", "processing", "packed", "shipped", "delivered"];
const STEP_LABEL: Partial<Record<OrderStatus, string>> = { paid: "Order placed", processing: "Being prepared", packed: "Packed", shipped: "On its way", delivered: "Delivered" };
const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "");

export default async function TrackOrder({ params }: { params: Promise<{ id: string }> }) {
  const customer = await currentCustomer();
  if (!customer) redirect("/account");
  const { id } = await params;
  if (!customer.orderIds.includes(id)) notFound();
  const o = await getOrder(id);
  if (!o) notFound();
  const stopped = o.status === "cancelled" || o.status === "refunded";
  const reached = STEPS.indexOf(o.status);
  const at = (s: OrderStatus) => o.timeline.find((t) => t.status === s)?.at;
  return (
    <div className="page-enter wrap track">
      <Link href="/account" className="text-link muted">← Your account</Link>
      <header className="track__head">
        <p className="eyebrow">Order {o.reference}</p>
        <h1 className="h1">{stopped ? STATUS_LABEL[o.status] : STEP_LABEL[o.status] ?? STATUS_LABEL[o.status]}</h1>
        <p className="muted">Placed {when(o.createdAt)} · {formatPrice(o.total)}</p>
      </header>

      {!stopped ? (
        <ol className="track__steps" aria-label="Delivery progress">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= reached ? "is-done" : ""} aria-current={i === reached ? "step" : undefined}>
              <span className="track__dot" /><b>{STEP_LABEL[s]}</b><small>{when(at(s))}</small>
            </li>
          ))}
        </ol>
      ) : <p className="notice">This order was {o.status}. Any payment is refunded to the original method within 5–7 working days.</p>}

      {o.tracking?.number && (
        <section className="track__card">
          <h2 className="h3">Shipment</h2>
          <p>{o.tracking.courier ?? "Courier"} · <b>{o.tracking.number}</b></p>
          {o.tracking.url && <a className="btn btn--sm" href={o.tracking.url} target="_blank" rel="noopener noreferrer">Track with courier ↗</a>}
        </section>
      )}

      <div className="track__grid">
        <section className="track__card">
          <h2 className="h3">Pieces</h2>
          <ul className="track__items">{o.items.map((i) => <li key={i.sku}><Link href={`/product/${i.handle}`}>{i.name}</Link><span className="muted">{i.variant ? `Size ${i.variant} · ` : ""}× {i.quantity}</span><span>{formatPrice(i.total)}</span></li>)}</ul>
          <dl className="totals"><div><dt>Subtotal</dt><dd>{formatPrice(o.subtotal)}</dd></div><div><dt>Shipping</dt><dd>{o.shipping ? formatPrice(o.shipping) : "Free"}</dd></div><div className="totals__grand"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div></dl>
        </section>
        <section className="track__card">
          <h2 className="h3">Delivering to</h2>
          <p>{o.customer.name}<br />{o.customer.line1}{o.customer.line2 ? `, ${o.customer.line2}` : ""}<br />{o.customer.city}, {o.customer.state} {o.customer.pincode}</p>
          <a className="text-link" href={whatsappUrl(`Hi Nemara, I have a question about my order ${o.reference}.`)} target="_blank" rel="noopener noreferrer">Questions? Message us on WhatsApp</a>
        </section>
      </div>
    </div>
  );
}
