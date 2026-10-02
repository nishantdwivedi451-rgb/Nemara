import Image from "next/image";
import Link from "next/link";
import type { Taxon } from "@/lib/commerce/types";

/** Choose Your Moment — four campaign cards; image above, copy below (never on top of the artwork). */
export function Moments({ occasions }: { occasions: Taxon[] }) {
  return (
    <section className="moments section" aria-labelledby="moments-title">
      <div className="wrap">
        <header className="section-head">
          <div>
            <p className="eyebrow">Choose your moment</p>
            <h2 id="moments-title" className="h1">Where is she <em>going tonight?</em></h2>
          </div>
        </header>
        <ul className="moments__grid">
          {occasions.map((o) => (
            <li key={o.slug}>
              <Link href={`/shop/${o.slug}`} className="moment">
                <div className="moment__img frame">
                  {o.image && <Image src={o.image.src} alt={o.image.alt} fill sizes="(min-width: 900px) 25vw, 80vw" unoptimized />}
                </div>
                <div className="moment__copy">
                  <p className="eyebrow">{o.label}</p>
                  <h3 className="h3">{o.name}</h3>
                  <p className="moment__line">{o.line}</p>
                  <span className="link-arrow">Shop the moment</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
