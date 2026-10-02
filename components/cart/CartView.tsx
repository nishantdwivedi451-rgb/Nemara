"use client";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/layout/StoreProvider";
import { IconMinus, IconPlus } from "@/components/brand/Icons";
import { formatPrice } from "@/lib/format";

export function CartView({ threshold, flat }: { threshold: number; flat: number }) {
  const { cart, setQty, remove, subtotal, hydrated } = useStore();
  const shipping = subtotal === 0 ? 0 : subtotal >= threshold ? 0 : flat;
  return (
    <div className="wrap cart-page">
      <header className="page-head"><p className="eyebrow edition"><b>◇</b> Your bag</p><h1 className="h1">The pieces you chose</h1></header>
      {!hydrated ? <p className="muted">Loading…</p> : cart.length === 0 ? (
        <div className="empty empty--page"><p className="hand">your bag is waiting.</p><Link href="/shop" className="btn">Explore Nemara</Link></div>
      ) : (
        <div className="cart-page__grid">
          <ul className="cart-lines cart-lines--page">
            {cart.map((c) => (
              <li key={c.key} className="cart-line">
                <Link href={`/product/${c.handle}`} className="frame ratio-45 cart-line__img"><Image src={c.image} alt={c.name} fill sizes="140px" unoptimized /></Link>
                <div className="cart-line__info">
                  <Link href={`/product/${c.handle}`} className="cart-line__name">{c.name}</Link>
                  {c.variantTitle && <span className="muted">Size {c.variantTitle}</span>}
                  <span className="muted">{formatPrice(c.price)} each</span>
                  <div className="qty" role="group" aria-label={`Quantity for ${c.name}`}>
                    <button onClick={() => (c.quantity > 1 ? setQty(c.key, c.quantity - 1) : remove(c.key))} aria-label="Decrease"><IconMinus /></button>
                    <span>{c.quantity}</span>
                    <button onClick={() => setQty(c.key, c.quantity + 1)} aria-label="Increase"><IconPlus /></button>
                  </div>
                </div>
                <div className="cart-line__end"><span>{formatPrice(c.price * c.quantity)}</span><button className="text-link muted" onClick={() => remove(c.key)}>Remove</button></div>
              </li>
            ))}
          </ul>
          <aside className="summary">
            <dl className="totals">
              <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
              <div className="totals__grand"><dt>Total</dt><dd>{formatPrice(subtotal + shipping)}</dd></div>
            </dl>
            <Link href="/checkout" className="btn btn--block">Checkout</Link>
            <p className="muted summary__note">Guest checkout · UPI · Cards · Net banking · Wallets</p>
          </aside>
        </div>
      )}
    </div>
  );
}
