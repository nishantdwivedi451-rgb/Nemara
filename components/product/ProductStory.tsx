import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/editorial/Reveal";
import type { Market, Product, Taxon } from "@/lib/commerce/types";

/** The Nemara story module: The find → The market → The check → Wear it, laid out as a magazine feature. */
export function ProductStory({ p, market, moment }: { p: Product; market: Market | null; moment?: Taxon }) {
  const sketch = p.story.find.sketch ?? p.images.find((i) => i.role === "story");
  const detail = p.story.check.image ?? p.images.find((i) => i.role === "detail");
  const momentImg = p.story.style.image ?? moment?.image;
  return (
    <section className="pstory" id="story" aria-labelledby="pstory-title">
      <div className="wrap">
        <header className="pstory__head">
          <p className="eyebrow">The story behind the find</p>
          <h2 id="pstory-title" className="display pstory__title">{p.name.split(" ").slice(0, -1).join(" ") || p.name} <em>{p.name.split(" ").slice(-1)}</em></h2>
        </header>

        <article className="pstory__ch pstory__ch--idea">
          <div className="pstory__text">
            <p className="eyebrow">The find{market ? ` · ${market.market}, ${market.city}` : ""}</p>
            <p className="pstory__lead">{p.story.find.body}</p>
          </div>
          {sketch && (
            <Reveal className="reveal pstory__sketch">
              <div className="frame ratio-45"><Image src={sketch.src} alt={sketch.alt} fill sizes="(min-width: 900px) 35vw, 90vw" unoptimized /></div>
              {p.story.find.note && <p className="pstory__margin"><span className="hand">“{p.story.find.note}”</span><span className="pstory__margin-by">From our buyer&apos;s notebook</span></p>}
            </Reveal>
          )}
        </article>

        {market && (
          <article className="pstory__ch pstory__ch--hand">
            <Reveal className="reveal pstory__portrait pstory__portrait--market"><Image src={market.image.src} alt={market.image.alt} fill sizes="(min-width: 900px) 30vw, 80vw" unoptimized /></Reveal>
            <div className="pstory__text">
              <p className="eyebrow">The market</p>
              <h3 className="h1">{market.city}</h3>
              <p className="muted">{market.market} · known for {market.signature.toLowerCase()}</p>
              <p className="pstory__lead">{market.summary}</p>
              <blockquote className="pull">“{market.tip}”</blockquote>
              <Link href={`/markets/${market.slug}`} className="link-arrow">Explore {market.city}</Link>
            </div>
          </article>
        )}

        <article className="pstory__ch pstory__ch--making">
          <div className="pstory__text">
            <p className="eyebrow">The Nemara check</p>
            <p className="pstory__lead">{p.story.check.body}</p>
            {p.story.check.steps && (
              <ol className="steps">{p.story.check.steps.map((s, i) => <Reveal as="li" key={s} delay={i * 120}>{s}</Reveal>)}</ol>
            )}
          </div>
          {detail && <Reveal className="reveal pstory__detail frame ratio-11"><Image src={detail.src} alt={detail.alt} fill sizes="(min-width: 900px) 30vw, 90vw" unoptimized /></Reveal>}
        </article>

        <article className="pstory__ch pstory__ch--moment">
          {momentImg && <Reveal className="reveal-crop pstory__moment-img frame"><Image src={momentImg.src} alt={momentImg.alt} fill sizes="(min-width: 900px) 40vw, 100vw" unoptimized /></Reveal>}
          <div className="pstory__text">
            <p className="eyebrow">Wear it{moment ? ` · ${moment.name}` : ""}</p>
            <p className="h2">{p.story.style.body}</p>
            {p.story.style.pairWith && p.story.style.pairWith.length > 0 && (
              <div className="pstory__pair"><span className="eyebrow">Pair it with</span><ul>{p.story.style.pairWith.map((w) => <li key={w}>{w}</li>)}</ul></div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
