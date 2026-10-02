import Image from "next/image";
import Link from "next/link";
import type { Taxon } from "@/lib/commerce/types";

/** Choose Your Moment — four campaign panels; expand on hover (desktop), swipe (mobile). */
export function Moments({ occasions }: { occasions: Taxon[] }) {
  return (
    <section className="moments section" aria-labelledby="moments-title">
      <div className="wrap moments__head">
        <p className="eyebrow edition"><b>04</b> Choose your moment</p>
        <h2 id="moments-title" className="h1">Where is she<br /><em>going tonight?</em></h2>
      </div>
      <div className="moments__track">
        {occasions.map((o, i) => (
          <Link key={o.slug} href={`/shop/${o.slug}`} className={`moment moment--${o.tone}`}>
            {o.image && <Image src={o.image.src} alt={o.image.alt} fill sizes="(min-width: 900px) 40vw, 80vw" unoptimized />}
            <div className="moment__copy">
              <span className="moment__n">0{i + 1}</span>
              <h3 className="h2">{o.name}</h3>
              <p className="eyebrow">{o.label}</p>
              <p className="moment__line">{o.line}</p>
              <span className="link-arrow">Shop the moment</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
