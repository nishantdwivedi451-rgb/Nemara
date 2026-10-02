"use client";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/layout/StoreProvider";
import { formatPrice } from "@/lib/format";

export function WishlistView() {
  const { wishlist, toggleWish, hydrated } = useStore();
  return (
    <>
      <header className="wrap page-head"><p className="eyebrow edition"><b>♡</b> Saved</p><h1 className="h1">Your wishlist</h1></header>
      <div className="wrap">
        {!hydrated ? <p className="muted">Loading…</p> : wishlist.length === 0 ? (
          <div className="empty empty--page"><p className="hand">nothing saved yet.</p><p className="muted">Tap the heart on any piece to keep it here.</p><Link href="/shop" className="btn">Explore Nemara</Link></div>
        ) : (
          <ul className="wish-grid">
            {wishlist.map((w) => (
              <li key={w.handle} className="wish-item">
                <Link href={`/product/${w.handle}`} className="frame ratio-45"><Image src={w.image} alt={w.name} fill sizes="(min-width: 900px) 25vw, 50vw" unoptimized /></Link>
                <div className="wish-item__meta"><Link href={`/product/${w.handle}`}>{w.name}</Link><span className="muted">{formatPrice(w.price)}</span></div>
                <div className="wish-item__ctas"><Link href={`/product/${w.handle}`} className="btn btn--sm">View</Link><button className="text-link muted" onClick={() => toggleWish(w)}>Remove</button></div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
