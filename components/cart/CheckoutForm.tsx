"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/components/layout/StoreProvider";
import { AuthFlow } from "@/components/account/AuthFlow";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void } } }

const STATES = ["Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

type Created = { provider: string; orderId?: string; amount?: number; publicKey?: string; redirect?: string; summary?: { subtotal: number; shipping: number; total: number } };

function loadRazorpay(): Promise<boolean> {
  return new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({ threshold, flat, demo, preview }: { threshold: number; flat: number; demo: boolean; preview: boolean }) {
  const { cart, subtotal, clear, hydrated, customer, accountsAvailable, accountReady, setCustomer, openAuth } = useStore();
  const saved = customer?.addresses ?? [];
  const [addrId, setAddrId] = useState<string>("new");
  const sel = saved.find((a) => a.id === addrId);
  const needAuth = accountReady && accountsAvailable && !customer;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [city, setCity] = useState(""); const [state, setState] = useState("");
  const [demoOrder, setDemoOrder] = useState<{ orderId: string; payload: Record<string, unknown> } | null>(null);
  const shipping = subtotal === 0 ? 0 : subtotal >= threshold ? 0 : flat;
  const lines = cart.map((c) => ({ handle: c.handle, variantId: c.variantId, quantity: c.quantity }));

  useEffect(() => { if (hydrated && cart.length) track("begin_checkout", { value: subtotal, currency: "INR", items: cart.length }); }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // preselect the default saved address once the account loads
  useEffect(() => {
    if (!customer?.addresses.length) { setAddrId("new"); return; }
    const d = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];
    setAddrId(d.id); setCity(d.city); setState(d.state);
  }, [customer]);
  const pickAddress = (id: string) => {
    setAddrId(id);
    const a = saved.find((x) => x.id === id);
    setCity(a?.city ?? ""); setState(a?.state ?? "");
  };

  async function lookupPin(pin: string) {
    if (!/^[1-9]\d{5}$/.test(pin)) return;
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const d = await r.json();
      const po = d?.[0]?.PostOffice?.[0];
      if (po) { setCity((c) => c || po.District); setState((s) => s || po.State); }
    } catch { /* autofill is a nicety */ }
  }

  async function complete(payload: Record<string, unknown>) {
    const r = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "We couldn't confirm your payment. If money was deducted, it will be refunded automatically — or contact us.");
    track("purchase", { transaction_id: d.reference, value: d.total, currency: "INR", items: lines.length });
    try { sessionStorage.setItem("nemara:last-order", JSON.stringify({ reference: d.reference, items: cart.map((c) => ({ name: c.name, handle: c.handle, image: c.image })), total: d.total, demo: d.demo })); } catch { /* ignore */ }
    clear();
    router.push(`/checkout/success?ref=${encodeURIComponent(d.reference)}`);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const address = { name: fd.name, email: fd.email, phone: fd.phone, line1: fd.line1, line2: fd.line2, city: fd.city, state: fd.state, pincode: fd.pincode, gift: fd.gift === "on", note: fd.note };
    setBusy(true); setError(""); setFields({});
    try {
      if (customer && fd.saveAddress === "on") {
        const s = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "save", address: { label: fd.addrLabel || "Home", name: fd.name, phone: fd.deliveryPhone || customer.phone, line1: fd.line1, line2: fd.line2, city: fd.city, state: fd.state, pincode: fd.pincode, isDefault: !saved.length } }) });
        const sd = await s.json();
        if (s.ok) setCustomer(sd.customer);
      }
      const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines, address, company: fd.company }) });
      const d: Created & { error?: string; fields?: Record<string, string> } = await r.json();
      if (!r.ok) {
        if ((d as { needAuth?: boolean }).needAuth) { setBusy(false); openAuth("checkout"); return; }
        setFields(d.fields ?? {}); throw new Error(d.error || "Please check your details.");
      }
      if (d.redirect) { window.location.href = d.redirect; return; }
      const base = { provider: d.provider, orderId: d.orderId, lines, address };
      if (d.provider === "razorpay") {
        if (!(await loadRazorpay()) || !window.Razorpay) throw new Error("The payment window couldn't load. Check your connection and try again.");
        const rzp = new window.Razorpay({
          key: d.publicKey, order_id: d.orderId, amount: Math.round((d.amount ?? 0) * 100), currency: "INR",
          name: "Nemara", description: "Wear your story.", image: `${window.location.origin}/icon.svg`,
          prefill: { name: address.name, email: address.email, contact: address.phone },
          notes: { pincode: address.pincode }, theme: { color: "#4B1D5C" },
          modal: { ondismiss: () => setBusy(false) },
          handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try { await complete({ ...base, orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature }); }
            catch (err) { setError((err as Error).message); setBusy(false); }
          },
        });
        rzp.on("payment.failed", () => { setError("The payment didn't go through. No money was taken — please try again or choose another method."); setBusy(false); });
        rzp.open();
      } else {
        setDemoOrder({ orderId: d.orderId!, payload: base });
      }
    } catch (err) { setError((err as Error).message); setBusy(false); }
  }

  if (hydrated && cart.length === 0 && !demoOrder) {
    return <div className="wrap empty empty--page"><p className="hand">your bag is empty.</p><Link href="/shop" className="btn">Explore Nemara</Link></div>;
  }
  const inv = (n: string) => (fields[n] ? { "aria-invalid": true, "aria-describedby": `${n}-err` } : {});
  const err = (n: string) => fields[n] && <span id={`${n}-err`} className="field-error">{fields[n]}</span>;

  return (
    <div className="wrap checkout">
      <header className="checkout__head">
        <Link href="/cart" className="text-link muted">← Back to bag</Link>
        <h1 className="h1">Checkout</h1>
        <p className="muted">{accountsAvailable ? "Verify once, then track your order and reuse your address next time." : "Takes about a minute."}</p>
      </header>
      <div className="checkout__grid">
        {needAuth ? (
          <div className="checkout__auth"><AuthFlow reason="checkout" embedded /></div>
        ) : (
        <form className="form checkout__form" onSubmit={submit} noValidate>
          {customer ? (
            <fieldset><legend className="h3">Contact</legend>
              <div className="checkout__verified">
                <span>Signed in as <b>{customer.name}</b></span>
                <span>+91 {customer.phone} <i>✓ verified</i></span>
                <span>{customer.email} <i>✓ verified</i></span>
              </div>
              <input type="hidden" name="email" value={customer.email} />
              <input type="hidden" name="phone" value={customer.phone} />
            </fieldset>
          ) : (
          <fieldset><legend className="h3">Contact</legend>
            <div className="form__row">
              <div className="field"><label htmlFor="co-email">Email</label><input id="co-email" name="email" type="email" className="input" autoComplete="email" required inputMode="email" {...inv("email")} />{err("email")}</div>
              <div className="field"><label htmlFor="co-phone">Mobile</label><input id="co-phone" name="phone" type="tel" className="input" autoComplete="tel-national" required inputMode="tel" placeholder="10-digit mobile" {...inv("phone")} />{err("phone")}</div>
            </div>
          </fieldset>
          )}
          <fieldset key={addrId}><legend className="h3">Delivery</legend>
            {saved.length > 0 && (
              <div className="checkout__addrs" role="radiogroup" aria-label="Saved addresses">
                {saved.map((a) => (
                  <button type="button" key={a.id} role="radio" aria-checked={addrId === a.id} className={`checkout__addr ${addrId === a.id ? "is-on" : ""}`} onClick={() => pickAddress(a.id)}>
                    <b>{a.label}</b><span>{a.line1}, {a.city} {a.pincode}</span>
                  </button>
                ))}
                <button type="button" role="radio" aria-checked={addrId === "new"} className={`checkout__addr ${addrId === "new" ? "is-on" : ""}`} onClick={() => pickAddress("new")}><b>+ New address</b><span>Deliver somewhere else</span></button>
              </div>
            )}
            <div className="field"><label htmlFor="co-name">Full name</label><input id="co-name" name="name" className="input" autoComplete="name" required defaultValue={sel?.name ?? customer?.name} {...inv("name")} />{err("name")}</div>
            <div className="field"><label htmlFor="co-l1">Address</label><input id="co-l1" name="line1" className="input" autoComplete="address-line1" required placeholder="House, street, area" defaultValue={sel?.line1} {...inv("line1")} />{err("line1")}</div>
            <div className="field"><label htmlFor="co-l2">Landmark <span className="muted">(optional)</span></label><input id="co-l2" name="line2" className="input" autoComplete="address-line2" defaultValue={sel?.line2} /></div>
            <div className="form__row form__row--3">
              <div className="field"><label htmlFor="co-pin">PIN code</label><input id="co-pin" name="pincode" className="input" autoComplete="postal-code" inputMode="numeric" maxLength={6} required defaultValue={sel?.pincode} onChange={(e) => lookupPin(e.target.value)} {...inv("pincode")} />{err("pincode")}</div>
              <div className="field"><label htmlFor="co-city">City</label><input id="co-city" name="city" className="input" autoComplete="address-level2" required value={city} onChange={(e) => setCity(e.target.value)} {...inv("city")} />{err("city")}</div>
              <div className="field"><label htmlFor="co-state">State</label>
                <select id="co-state" name="state" className="select" autoComplete="address-level1" required value={state} onChange={(e) => setState(e.target.value)} {...inv("state")}>
                  <option value="">Select</option>{STATES.map((s) => <option key={s}>{s}</option>)}
                </select>{err("state")}</div>
            </div>
            {customer && addrId === "new" && (
              <div className="checkout__save">
                <label className="check"><input type="checkbox" name="saveAddress" defaultChecked /> Save this address to my account as</label>
                <input name="addrLabel" className="input" defaultValue={saved.length ? "Other" : "Home"} aria-label="Address label" />
              </div>
            )}
            <label className="check"><input type="checkbox" name="gift" /> This is a gift — hide prices and add a handwritten story card</label>
            <div className="field"><label htmlFor="co-note">Note for us <span className="muted">(optional)</span></label><input id="co-note" name="note" className="input" maxLength={300} /></div>
            <input name="company" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          </fieldset>
          <fieldset><legend className="h3">Payment</legend>
            <p className="muted">UPI (GPay, PhonePe, Paytm), cards, net banking and wallets — in a secure window from our payment partner. Nemara never sees your card or UPI details.</p>
            {demo && <p className="notice">{preview ? "Preview edition: " : ""}no payment gateway is connected yet, so this checkout runs in <strong>demo mode</strong> and no money will be taken.</p>}
          </fieldset>
          {error && <p className="field-error checkout__error" role="alert">{error}</p>}
          <button className="btn btn--block checkout__pay" disabled={busy || !hydrated}>{busy ? "Opening secure payment…" : `Pay ${formatPrice(subtotal + shipping)}`}</button>
          <p className="muted checkout__legal">By placing your order you agree to our <Link className="text-link" href="/info/terms">terms</Link> and <Link className="text-link" href="/info/returns">returns policy</Link>.</p>
        </form>
        )}

        <aside className="summary checkout__summary" aria-label="Order summary">
          <h2 className="h3">Your order</h2>
          <ul className="sum-lines">
            {cart.map((c) => (
              <li key={c.key}><span className="frame ratio-45"><Image src={c.image} alt="" fill sizes="64px" unoptimized /><i>{c.quantity}</i></span>
                <span>{c.name}{c.variantTitle && <small className="muted"> · {c.variantTitle}</small>}</span><span>{formatPrice(c.price * c.quantity)}</span></li>
            ))}
          </ul>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
            <div className="totals__grand"><dt>Total</dt><dd>{formatPrice(subtotal + shipping)}</dd></div>
          </dl>
        </aside>
      </div>

      {demoOrder && (
        <div className="demo-pay" role="dialog" aria-modal="true" aria-label="Demo payment">
          <div className="demo-pay__card">
            <p className="eyebrow">Demo payment · no money moves</p>
            <h2 className="h2">{formatPrice(subtotal + shipping)}</h2>
            <p className="muted">When Razorpay keys are added, this step becomes the real payment window (UPI, cards, net banking, wallets).</p>
            <div className="demo-pay__methods">{["UPI", "Card", "Net banking", "Wallet"].map((m) => <span key={m} className="chip">{m}</span>)}</div>
            <button className="btn btn--block" onClick={async () => { try { await complete({ ...demoOrder.payload, paymentId: "demo", signature: "demo" }); } catch (e) { setError((e as Error).message); setDemoOrder(null); setBusy(false); } }}>Simulate successful payment</button>
            <button className="text-link muted" onClick={() => { setDemoOrder(null); setBusy(false); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
