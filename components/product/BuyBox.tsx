"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/layout/StoreProvider";
import { IconCamera, IconHeart } from "@/components/brand/Icons";
import { TryOnModal } from "@/components/tryon/TryOnModal";
import { formatPrice, cx } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { Artist, Product } from "@/lib/commerce/types";

type Props = { p: Product; artist: Artist | null; shipping: { freeShippingThreshold: number; dispatchDays: string; returnsDays: number } };

export function BuyBox({ p, artist, shipping }: Props) {
  const { add, toggleWish, isWished } = useStore();
  const [variant, setVariant] = useState<string | null>(p.variants.length === 1 ? p.variants[0].id : null);
  const [err, setErr] = useState("");
  const [tryOn, setTryOn] = useState(false);
  const [stuck, setStuck] = useState(false);
  const mainCta = useRef<HTMLButtonElement>(null);
  const wished = isWished(p.handle);
  const soldOut = p.availability === "sold_out";

  useEffect(() => { track("view_item", { item_id: p.handle, item_name: p.name, value: p.price, currency: "INR", category: p.category }); }, [p]);
  useEffect(() => {
    const el = mainCta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToBag = () => {
    if (p.variants.length && !variant) { setErr("Choose your size first."); return; }
    const v = p.variants.find((x) => x.id === variant);
    add({ handle: p.handle, name: p.name, price: v?.price ?? p.price, image: p.images[0].src, variantId: v?.id, variantTitle: v?.title });
    setErr("");
  };
  const availability = soldOut ? "Sold out — join the waitlist on WhatsApp" : p.availability === "low_stock" ? `Only ${p.inventory} made in this batch` : `In stock · ships in ${shipping.dispatchDays}`;

  return (
    <div className="buybox">
      <p className="eyebrow buybox__cat">{p.category.replace("-", " ")} · {p.sku}</p>
      <h1 className="h1 buybox__name">{p.name}</h1>
      {p.subtitle && <p className="buybox__sub">{p.subtitle}</p>}
      <p className="buybox__price">{formatPrice(p.price)} <span className="muted">incl. of all taxes</span></p>
      <p className="buybox__desc">{p.description}</p>
      {artist && (
        <Link href={`/artists/${artist.slug}`} className="buybox__artist">
          <span className="eyebrow">Made by</span>
          <span className="buybox__artist-name">{artist.name}</span>
          <span className="muted">{artist.craft} · {artist.location}</span>
        </Link>
      )}

      {p.variants.length > 0 && (
        <fieldset className="buybox__sizes">
          <legend className="label">Size <Link href="/info/size-guide" className="text-link muted">Kada size guide</Link></legend>
          <div className="chips">
            {p.variants.map((v) => (
              <button key={v.id} type="button" className={cx("chip chip--size", variant === v.id && "is-on")} aria-pressed={variant === v.id} disabled={!v.available}
                onClick={() => { setVariant(v.id); setErr(""); }}>{v.title}</button>
            ))}
          </div>
          {err && <p className="field-error" role="alert">{err}</p>}
        </fieldset>
      )}

      <p className={cx("buybox__avail", p.availability)}><span className="dot" />{availability}</p>

      <div className="buybox__ctas">
        <button ref={mainCta} className="btn btn--block" onClick={addToBag} disabled={soldOut}>Add to bag — {formatPrice(p.price)}</button>
        <div className="buybox__row">
          {p.tryOn?.supported && <button className="btn btn--ghost" onClick={() => setTryOn(true)}><IconCamera /> Try this on</button>}
          <button className={cx("btn btn--ghost buybox__wish", wished && "is-on")} aria-pressed={wished} onClick={() => toggleWish({ handle: p.handle, name: p.name, price: p.price, image: p.images[0].src })} aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}>
            <IconHeart filled={wished} />
          </button>
        </div>
      </div>

      <ul className="buybox__promises">
        <li>Free shipping over {formatPrice(shipping.freeShippingThreshold)}</li>
        <li>{shipping.returnsDays}-day easy returns</li>
        <li>Pay by UPI, card, net banking or wallet</li>
      </ul>

      <div className="details">
        <details open><summary>Material</summary><p>{p.material}</p></details>
        <details><summary>Dimensions</summary><p>{p.dimensions}</p></details>
        <details><summary>Care</summary><p>{p.care}</p></details>
        <details><summary>Shipping</summary><p>Dispatched in {shipping.dispatchDays} in a Nemara pouch and story card. Free across India over {formatPrice(shipping.freeShippingThreshold)}. <Link className="text-link" href="/info/shipping">Shipping details</Link></p></details>
        <details><summary>Returns</summary><p>Changed your mind? Return unworn pieces within {shipping.returnsDays} days of delivery. Earrings are non-returnable for hygiene unless faulty. <Link className="text-link" href="/info/returns">Returns policy</Link></p></details>
      </div>

      {/* sticky mobile bar */}
      <div className={cx("sticky-buy", stuck && "is-on")} aria-hidden={!stuck}>
        <div><span className="sticky-buy__name">{p.name}</span><span className="muted">{formatPrice(p.price)}</span></div>
        {p.tryOn?.supported && <button className="icon-btn" onClick={() => setTryOn(true)} aria-label="Try this on" tabIndex={stuck ? 0 : -1}><IconCamera /></button>}
        <button className="btn btn--sm" onClick={addToBag} disabled={soldOut} tabIndex={stuck ? 0 : -1}>Add to bag</button>
      </div>

      {tryOn && p.tryOn && <TryOnModal product={p} onClose={() => setTryOn(false)} />}
    </div>
  );
}
