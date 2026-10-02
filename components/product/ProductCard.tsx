"use client";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/layout/StoreProvider";
import { IconCamera, IconHeart, IconPlus } from "@/components/brand/Icons";
import { formatPrice, cx } from "@/lib/format";
import type { Product } from "@/lib/commerce/types";

export type CardProduct = Pick<Product, "handle" | "name" | "subtitle" | "price" | "compareAtPrice" | "images" | "availability" | "variants" | "tryOn" | "story">;

export function ProductCard({ p, size = "md", priority = false, showNote = false }: { p: CardProduct; size?: "md" | "lg"; priority?: boolean; showNote?: boolean }) {
  const { add, toggleWish, isWished } = useStore();
  const hero = p.images[0], hover = p.images.find((i) => i.role === "worn") ?? p.images[1];
  const wished = isWished(p.handle);
  const needsSize = p.variants.length > 0;
  const soldOut = p.availability === "sold_out";
  const wishItem = { handle: p.handle, name: p.name, price: p.price, image: hero.src };

  return (
    <article className={cx("pcard", size === "lg" && "pcard--lg")}>
      <div className="pcard__media">
        <Link href={`/product/${p.handle}`} className="pcard__link" aria-label={`${p.name}, ${formatPrice(p.price)}`}>
          <div className="frame ratio-45">
            <Image src={hero.src} alt={hero.alt} fill sizes={size === "lg" ? "(min-width: 900px) 50vw, 100vw" : "(min-width: 900px) 33vw, 50vw"} priority={priority} unoptimized />
            {hover && <Image className="pcard__hover" src={hover.src} alt="" fill sizes="(min-width: 900px) 33vw, 50vw" unoptimized />}
          </div>
        </Link>
        {p.availability === "low_stock" && <span className="pcard__flag">Only a few made</span>}
        {soldOut && <span className="pcard__flag pcard__flag--out">Sold out</span>}
        <button className={cx("pcard__wish", wished && "is-on")} onClick={() => toggleWish(wishItem)} aria-pressed={wished} aria-label={wished ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}>
          <IconHeart filled={wished} />
        </button>
        <div className="pcard__actions">
          {p.tryOn?.supported && <Link href={`/try-on?piece=${p.handle}`} className="pcard__try"><IconCamera /> Try it on</Link>}
          {!soldOut && (needsSize
            ? <Link href={`/product/${p.handle}`} className="pcard__add">Choose size</Link>
            : <button className="pcard__add" onClick={() => add({ handle: p.handle, name: p.name, price: p.price, image: hero.src })}><IconPlus /> Quick add</button>)}
        </div>
      </div>
      <Link href={`/product/${p.handle}`} className="pcard__meta">
        <h3 className="pcard__name">{p.name}</h3>
        <span className="pcard__price">{formatPrice(p.price)}</span>
        {p.subtitle && <span className="pcard__sub">{p.subtitle}</span>}
        {showNote && p.story.idea.note && <span className="hand pcard__note">“{p.story.idea.note}”</span>}
      </Link>
    </article>
  );
}
