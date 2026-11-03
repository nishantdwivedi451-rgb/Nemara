import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/editorial/Reveal";
import type { Market, Product } from "@/lib/commerce/types";

/** "Every find has a story" — the buyer's sketch dissolves into the finished piece. */
export function StoryTeaser({ product, market }: { product: Product; market?: Market | null }) {
  const sketch = product.images.find((i) => i.role === "story") ?? product.images[0];
  const hero = product.images[0];
  return (
    <section className="teaser section" aria-labelledby="teaser-title">
      <div className="wrap teaser__grid">
        <Reveal className="teaser__visual reveal-crop">
          <Link href={`/product/${product.handle}#story`} className="teaser__swap frame ratio-45" aria-label={`Read the story of ${product.name}`}>
            <Image src={hero.src} alt={hero.alt} fill sizes="(min-width: 900px) 45vw, 100vw" unoptimized />
            <Image className="teaser__sketch" src={sketch.src} alt="" fill sizes="(min-width: 900px) 45vw, 100vw" unoptimized />
          </Link>
        </Reveal>
        <div className="teaser__copy">
          <p className="eyebrow">Every find has a story</p>
          <h2 id="teaser-title" className="h1">{product.name}</h2>
          {product.story.find.note && <p className="hand teaser__note">“{product.story.find.note}”</p>}
          <ol className="teaser__steps">
            <li><span className="eyebrow">The find{market ? ` · ${market.city}` : ""}</span><p>{product.story.find.body.split(". ").slice(0, 2).join(". ").replace(/\.?$/, ".")}</p></li>
            <li><span className="eyebrow">The check</span><p>{product.story.check.body}</p></li>
            <li><span className="eyebrow">Wear it</span><p>{product.story.style.body}</p></li>
          </ol>
          <Link href={`/product/${product.handle}#story`} className="link-arrow">Read the whole story</Link>
        </div>
      </div>
    </section>
  );
}
