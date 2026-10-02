"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Taxon } from "@/lib/commerce/types";

/** Typographic index — on desktop a preview image follows the hovered line. */
export function CategoryIndex({ categories, counts }: { categories: Taxon[]; counts: Record<string, number> }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="cindex" onMouseLeave={() => setHover(null)}>
      <ul>
        {categories.map((c, i) => (
          <li key={c.slug}>
            <Link href={`/shop/${c.slug}`} className="cindex__row" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
              <span className="cindex__n">0{i + 1}</span>
              <span className="cindex__name">{c.name}</span>
              <span className="cindex__line">{c.line}</span>
              <span className="cindex__count">{counts[c.slug] ?? 0} pieces</span>
              {c.image && <span className="cindex__thumb frame ratio-45 mobile-only"><Image src={c.image.src} alt="" fill sizes="40vw" unoptimized /></span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className={`cindex__preview desktop-only ${hover !== null ? "is-on" : ""}`} aria-hidden="true">
        {categories.map((c, i) => c.image && (
          <Image key={c.slug} src={c.image.src} alt="" fill sizes="30vw" className={hover === i ? "is-on" : ""} unoptimized />
        ))}
      </div>
    </div>
  );
}
