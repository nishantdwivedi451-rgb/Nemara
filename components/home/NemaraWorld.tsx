"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const WORLD = [
  { k: "Markets", img: "/art/markets/jaipur.svg", note: "six cities. one wardrobe.", body: "Johari Bazaar, Dariba Kalan, Lal Chowk, Laad Bazaar, Colaba Causeway, Law Garden. We walk India's most famous jewellery markets every season, so you don't have to.", href: "/markets" },
  { k: "Handpicked", img: "/products/rajwada-kada/01.webp", note: "one in fifty makes it.", body: "We pick for three things: beautiful, wearable, right for now. Too heavy to dance in? It doesn't make it. Already everywhere? Neither does that.", href: "/our-story" },
  { k: "Checked", img: "/products/jaali-bloom-ad-kada-pair/05.webp", note: "checked like fine jewellery.", body: "Plating, stones, clasps, comfort and every edge that touches your skin — checked before it ships, and backed by a 3-month warranty.", href: "/info/warranty" },
  { k: "Styled", img: "/products/cupids-arrow-bracelet/02.webp", note: "office to dinner, no change needed.", body: "Every piece comes with how to wear it and what to pair it with. Ask the Nemara Stylist where you're going and get an edit back.", href: "/stylist" },
  { k: "Premium", img: "/products/radiant-grace-ad-set/02.webp", note: "premium, not precious.", body: "The look and finish of fine jewellery at a price that lets you build a whole wardrobe — and actually wear it on a Tuesday.", href: "/shop" },
  { k: "Yours", img: "/products/cascade-tassel-earrings/02.webp", note: "see it on you, then decide.", body: "Try any piece on with your camera. Mix, stack, break the rules — it's your wardrobe and your story.", href: "/try-on" },
];

export function NemaraWorld() {
  const [a, setA] = useState(0);
  const cur = WORLD[a];
  return (
    <section className="world section" aria-labelledby="world-title">
      <div className="wrap">
        <div className="world__head">
          <p className="eyebrow">The Nemara world</p>
          <h2 id="world-title" className="h2">Six words we curate by.</h2>
        </div>
        <div className="world__grid">
          <ol className="world__list" role="tablist" aria-label="The Nemara world">
            {WORLD.map((w, i) => (
              <li key={w.k}>
                <button role="tab" aria-selected={a === i} aria-controls="world-panel" id={`world-${i}`}
                  className={`world__word ${a === i ? "is-on" : ""}`} onMouseEnter={() => setA(i)} onFocus={() => setA(i)} onClick={() => setA(i)}>
                  <span className="world__k">{w.k}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="world__panel" id="world-panel" role="tabpanel" aria-labelledby={`world-${a}`}>
            <div className="world__frame arch">
              {WORLD.map((w, i) => (
                <Image key={w.k} src={w.img} alt="" fill sizes="(min-width: 900px) 40vw, 90vw" className={i === a ? "is-on" : ""} unoptimized />
              ))}
            </div>
            <div className="world__text" key={a}>
              <p className="world__note">{cur.note}</p>
              <p>{cur.body}</p>
              <Link href={cur.href} className="link-arrow">Go deeper</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
