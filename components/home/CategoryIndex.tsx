"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Taxon } from "@/lib/commerce/types";

/** Typographic index with a dedicated preview column (desktop) — image never overlaps the text. */
export function CategoryIndex({ categories, counts }: { categories: Taxon[]; counts: Record<string, number> }) {
  const [active, setActive] = useState(0);
  return (
    <div className="cindex">
      <ul className="cindex__list">
        {categories.map((c, i) => (
          <li key={c.slug}>
            <Link href={`/shop/${c.slug}`} className={`cindex__row ${active === i ? "is-on" : ""}`} onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
              <span className="cindex__text">
                <span className="cindex__name">{c.name}</span>
                <span className="cindex__line">{c.line}</span>
              </span>
              <span className="cindex__count">{counts[c.slug] ?? 0} pieces</span>
              {c.image && <span className="cindex__thumb frame mobile-only"><Image src={c.image.src} alt="" fill sizes="88px" unoptimized /></span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="cindex__preview frame desktop-only" aria-hidden="true">
        {categories.map((c, i) => c.image && (
          <Image key={c.slug} src={c.image.src} alt="" fill sizes="30vw" className={active === i ? "is-on" : ""} unoptimized />
        ))}
      </div>
    </div>
  );
}
