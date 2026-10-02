"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore, type Address } from "@/components/layout/StoreProvider";
import { AuthFlow } from "./AuthFlow";
import { AddressForm } from "./AddressForm";
import { formatPrice } from "@/lib/format";

type OrderRow = { id: string; reference: string; status: string; statusLabel: string; total: number; createdAt: string; items: { name: string; quantity: number; handle: string }[]; tracking?: { courier?: string; number?: string; url?: string } };
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function AccountView() {
  const { customer, setCustomer, accountReady, accountsAvailable, logout, wishlist } = useStore();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [editing, setEditing] = useState<Address | "new" | null>(null);

  useEffect(() => {
    if (!customer) return;
    fetch("/api/account/orders", { cache: "no-store" }).then((r) => r.json()).then((d) => setOrders(d.orders ?? [])).catch(() => setOrders([]));
  }, [customer]);

  async function addrOp(body: object) {
    const r = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (r.ok) setCustomer(d.customer);
    return d;
  }

  if (!accountReady) return <div className="wrap account"><p className="muted">Loading…</p></div>;
  if (!accountsAvailable) return <div className="wrap account empty empty--page"><h1 className="h2">Accounts open soon</h1><p className="muted">You can still shop and save pieces on this device.</p><Link className="btn" href="/shop">Explore Nemara</Link></div>;
  if (!customer) return <div className="wrap account account--auth"><AuthFlow reason="account" /></div>;

  return (
    <div className="wrap account">
      <header className="account__head">
        <div><p className="eyebrow">Your account</p><h1 className="h1">Hello, {customer.name.split(" ")[0]}.</h1></div>
        <button className="btn btn--ghost btn--sm" onClick={logout}>Sign out</button>
      </header>

      <div className="account__grid">
        <section className="account__card account__orders" aria-labelledby="orders-h">
          <h2 id="orders-h" className="h3">Your orders</h2>
          {orders === null ? <p className="muted">Loading your orders…</p> : orders.length === 0 ? (
            <div className="account__empty"><p className="muted">No orders yet. When you place one, you can track it here.</p><Link href="/shop" className="link-arrow">Explore the edition</Link></div>
          ) : (
            <ul className="account__orderlist">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.id}`} className="account__order">
                    <div><b>{o.reference}</b><span className="muted">{date(o.createdAt)} · {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</span></div>
                    <div className="account__order-end"><span className={`ostatus ostatus--${o.status}`}>{o.statusLabel}</span><span>{formatPrice(o.total)}</span></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="account__card" aria-labelledby="profile-h">
          <h2 id="profile-h" className="h3">Profile</h2>
          <dl className="account__dl">
            <div><dt>Name</dt><dd>{customer.name}</dd></div>
            <div><dt>Mobile</dt><dd>+91 {customer.phone} {customer.phoneVerified && <span className="verified">✓ verified</span>}</dd></div>
            <div><dt>Email</dt><dd>{customer.email} {customer.emailVerified && <span className="verified">✓ verified</span>}</dd></div>
            <div><dt>Member since</dt><dd>{date(customer.createdAt)}</dd></div>
          </dl>
          <Link href="/wishlist" className="account__wish">
            <span>Your wishlist</span><b>{wishlist.length} {wishlist.length === 1 ? "piece" : "pieces"}</b>
            <span className="account__wish-imgs">{wishlist.slice(0, 3).map((w) => <span key={w.handle} className="frame"><Image src={w.image} alt="" fill sizes="40px" unoptimized /></span>)}</span>
          </Link>
        </section>

        <section className="account__card account__addresses" aria-labelledby="addr-h">
          <div className="account__card-head"><h2 id="addr-h" className="h3">Saved addresses</h2>{editing === null && <button className="text-link" onClick={() => setEditing("new")}>+ Add address</button>}</div>
          {editing !== null ? (
            <AddressForm initial={editing === "new" ? undefined : editing} defaultName={customer.name} defaultPhone={customer.phone}
              onCancel={() => setEditing(null)} onSave={async (a) => { const d = await addrOp({ op: "save", address: a }); if (!d.error) setEditing(null); return d; }} />
          ) : customer.addresses.length === 0 ? <p className="muted">No saved addresses yet — they&apos;re added automatically when you check out.</p> : (
            <ul className="account__addrlist">
              {customer.addresses.map((a) => (
                <li key={a.id} className="account__addr">
                  <div><b>{a.label}</b>{a.isDefault && <span className="verified">Default</span>}<p>{a.name} · {a.phone}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}</p></div>
                  <div className="account__addr-actions">
                    <button className="text-link" onClick={() => setEditing(a)}>Edit</button>
                    {!a.isDefault && <button className="text-link" onClick={() => addrOp({ op: "default", id: a.id })}>Make default</button>}
                    <button className="text-link muted" onClick={() => { if (window.confirm("Remove this address?")) addrOp({ op: "delete", id: a.id }); }}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
