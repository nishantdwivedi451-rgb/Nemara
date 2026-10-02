"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "./StoreProvider";
import { IconClose, IconMinus, IconPlus } from "@/components/brand/Icons";
import { formatPrice } from "@/lib/format";

export function CartDrawer({ freeShippingThreshold, flatRate }: { freeShippingThreshold: number; flatRate: number }) {
  const { cart, cartOpen, setCartOpen, setQty, remove, subtotal } = useStore();
  const pathname = usePathname();
  useEffect(() => { setCartOpen(false); }, [pathname, setCartOpen]);
  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [cartOpen, setCartOpen]);

  const shipping = subtotal === 0 ? 0 : subtotal >= freeShippingThreshold ? 0 : flatRate;
  const toFree = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <>
      <div className={`drawer-scrim ${cartOpen ? "is-open" : ""}`} onClick={() => setCartOpen(false)} />
      <aside className={`cart-drawer ${cartOpen ? "is-open" : ""}`} aria-label="Your bag" aria-hidden={!cartOpen} role="dialog" aria-modal="true">
        <div className="cart-drawer__head">
          <h2 className="h3">Your bag</h2>
          <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Close bag"><IconClose /></button>
        </div>
        {cart.length === 0 ? (
          <div className="empty">
            <p className="hand">nothing here yet —</p>
            <p className="muted">Every piece has a story. Find the one that sounds like yours.</p>
            <Link href="/shop" className="btn" tabIndex={cartOpen ? 0 : -1}>Explore Nemara</Link>
          </div>
        ) : (
          <>
            <p className="cart-drawer__ship">
              {toFree > 0 ? <>You&apos;re {formatPrice(toFree)} away from free shipping.</> : <>Shipping is on us.</>}
              <span className="meter"><span style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }} /></span>
            </p>
            <ul className="cart-lines">
              {cart.map((c) => (
                <li key={c.key} className="cart-line">
                  <Link href={`/product/${c.handle}`} className="frame ratio-45 cart-line__img" tabIndex={cartOpen ? 0 : -1}>
                    <Image src={c.image} alt="" fill sizes="96px" unoptimized />
                  </Link>
                  <div className="cart-line__info">
                    <Link href={`/product/${c.handle}`} className="cart-line__name" tabIndex={cartOpen ? 0 : -1}>{c.name}</Link>
                    {c.variantTitle && <span className="muted cart-line__variant">Size {c.variantTitle}</span>}
                    <div className="qty" role="group" aria-label={`Quantity for ${c.name}`}>
                      <button onClick={() => (c.quantity > 1 ? setQty(c.key, c.quantity - 1) : remove(c.key))} aria-label="Decrease quantity" tabIndex={cartOpen ? 0 : -1}><IconMinus /></button>
                      <span aria-live="polite">{c.quantity}</span>
                      <button onClick={() => setQty(c.key, c.quantity + 1)} aria-label="Increase quantity" tabIndex={cartOpen ? 0 : -1}><IconPlus /></button>
                    </div>
                  </div>
                  <div className="cart-line__end">
                    <span>{formatPrice(c.price * c.quantity)}</span>
                    <button className="text-link muted" onClick={() => remove(c.key)} tabIndex={cartOpen ? 0 : -1}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-drawer__foot">
              <dl className="totals">
                <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
                <div><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
                <div className="totals__grand"><dt>Total</dt><dd>{formatPrice(subtotal + shipping)}</dd></div>
              </dl>
              <Link href="/checkout" className="btn btn--block" tabIndex={cartOpen ? 0 : -1}>Checkout</Link>
              <Link href="/cart" className="link-arrow cart-drawer__view" tabIndex={cartOpen ? 0 : -1}>View bag</Link>
              <p className="muted cart-drawer__pay">UPI · Cards · Net banking · Wallets</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
