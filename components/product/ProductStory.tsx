import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/editorial/Reveal";
import type { Artist, Product, Taxon } from "@/lib/commerce/types";

/** The Nemara story module: Idea → Hand → Making → Moment, laid out as a magazine feature. */
export function ProductStory({ p, artist, moment }: { p: Product; artist: Artist | null; moment?: Taxon }) {
  const sketch = p.story.idea.sketch ?? p.images.find((i) => i.role === "story");
  const detail = p.story.making.image ?? p.images.find((i) => i.role === "detail");
  const momentImg = p.story.moment.image ?? moment?.image;
  return (
    <section className="pstory" id="story" aria-labelledby="pstory-title">
      <div className="wrap">
        <header className="pstory__head">
          <p className="eyebrow">The story behind the piece</p>
          <h2 id="pstory-title" className="display pstory__title">{p.name.split(" ").slice(0, -1).join(" ") || p.name} <em>{p.name.split(" ").slice(-1)}</em></h2>
        </header>

        <article className="pstory__ch pstory__ch--idea">
          <div className="pstory__text">
            <p className="eyebrow">The idea</p>
            <p className="pstory__lead">{p.story.idea.body}</p>
          </div>
          {sketch && (
            <Reveal className="reveal pstory__sketch">
              <div className="frame ratio-45"><Image src={sketch.src} alt={sketch.alt} fill sizes="(min-width: 900px) 35vw, 90vw" unoptimized /></div>
              {p.story.idea.note && <p className="pstory__margin"><span className="hand">“{p.story.idea.note}”</span><span className="pstory__margin-by">Pratima, in the margin of her sketchbook</span></p>}
            </Reveal>
          )}
        </article>

        {artist && (
          <article className="pstory__ch pstory__ch--hand">
            <Reveal className="reveal-crop pstory__portrait arch"><Image src={artist.portrait.src} alt={artist.portrait.alt} fill sizes="(min-width: 900px) 30vw, 80vw" unoptimized /></Reveal>
            <div className="pstory__text">
              <p className="eyebrow">The hand</p>
              <h3 className="h1">{artist.name}</h3>
              <p className="muted">{artist.location} · {artist.craft}{artist.yearsOfPractice ? ` · ${artist.yearsOfPractice} years` : ""}</p>
              <p className="pstory__lead">{p.story.hand.contribution}</p>
              {(p.story.hand.quote || artist.quote) && <blockquote className="pull">“{p.story.hand.quote || artist.quote}”</blockquote>}
              <Link href={`/artists/${artist.slug}`} className="link-arrow">The hand behind the piece</Link>
            </div>
          </article>
        )}

        <article className="pstory__ch pstory__ch--making">
          <div className="pstory__text">
            <p className="eyebrow">The making</p>
            <p className="pstory__lead">{p.story.making.body}</p>
            {p.story.making.steps && (
              <ol className="steps">{p.story.making.steps.map((s, i) => <Reveal as="li" key={s} delay={i * 120}>{s}</Reveal>)}</ol>
            )}
          </div>
          {detail && <Reveal className="reveal pstory__detail frame ratio-11"><Image src={detail.src} alt={detail.alt} fill sizes="(min-width: 900px) 30vw, 90vw" unoptimized /></Reveal>}
        </article>

        <article className="pstory__ch pstory__ch--moment">
          {momentImg && <Reveal className="reveal-crop pstory__moment-img frame"><Image src={momentImg.src} alt={momentImg.alt} fill sizes="(min-width: 900px) 40vw, 100vw" unoptimized /></Reveal>}
          <div className="pstory__text">
            <p className="eyebrow">The moment{moment ? ` · ${moment.name}` : ""}</p>
            <p className="h2">{p.story.moment.body}</p>
          </div>
        </article>
      </div>
    </section>
  );
}
