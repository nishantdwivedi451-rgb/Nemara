"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const WORLD = [
  { k: "Design", img: "/art/products/raat-rani-necklace-set/story.svg", note: "every piece starts as a line in a notebook.", body: "Pratima draws every Nemara piece by hand, in purple ink, before a single gram of metal is touched. Ideas are tested on paper, argued with, redrawn.", href: "/our-story" },
  { k: "Craft", img: "/art/products/aangan-kada/detail.svg", note: "pressed, twisted, fired, finished.", body: "Filigree from Cuttack. Meenakari from Jaipur. Repoussé from Thrissur. Brass from Moradabad. Old techniques, asked new questions.", href: "/artists" },
  { k: "Artists", img: "/art/artists/ramesh-soni.svg", note: "a name behind every piece.", body: "Every product page tells you who made it, where, and how. Not ‘artisans’ — artists, credited by name.", href: "/artists" },
  { k: "India", img: "/art/campaign/celebration.svg", note: "born here. not stuck in the past.", body: "Nemara borrows from India’s courtyards, monsoons and festival nights — then designs for the life you actually live today.", href: "/our-story" },
  { k: "Women", img: "/art/campaign/nine-to-five.svg", note: "for the many versions of her.", body: "Founded by a woman, made in studios led by women, worn by women who refuse to be one thing. That is the whole point.", href: "/our-story" },
  { k: "Expression", img: "/art/campaign/after-hours.svg", note: "see it on you, then decide.", body: "Try any piece on with your camera. Ask the Nemara Stylist. Mix, stack, break the rules — it is your story.", href: "/try-on" },
];

export function NemaraWorld() {
  const [a, setA] = useState(0);
  const cur = WORLD[a];
  return (
    <section className="world section" aria-labelledby="world-title">
      <div className="wrap">
        <div className="world__head">
          <p className="eyebrow">The Nemara world</p>
          <h2 id="world-title" className="h2">Six words we build everything on.</h2>
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
