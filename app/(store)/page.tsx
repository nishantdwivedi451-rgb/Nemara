import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { NemaraWorld } from "@/components/home/NemaraWorld";
import { Moments } from "@/components/home/Moments";
import { StoryTeaser } from "@/components/home/StoryTeaser";
import { CategoryIndex } from "@/components/home/CategoryIndex";
import { ProductRail } from "@/components/product/ProductRail";
import { Reveal, Lines } from "@/components/editorial/Reveal";
import { StylistPrompt } from "@/components/stylist/StylistPrompt";
import { commerce } from "@/lib/commerce";
import { getArtists, getArtist } from "@/lib/content";
import { SITE } from "@/lib/site";

export default async function Home() {
  const [all, newest, categories, occasions, artists] = await Promise.all([
    commerce.getProducts(), commerce.getProducts({ sort: "newest", limit: 8 }), commerce.getCategories(), commerce.getOccasions(), getArtists(),
  ]);
  const storyPiece = all.find((p) => p.handle === "monsoon-hour-jhumka") ?? all[0];
  const storyArtist = await getArtist(storyPiece.artist);
  const counts = Object.fromEntries(categories.map((c) => [c.slug, all.filter((p) => p.category === c.slug).length]));

  return (
    <div className="page-enter">
      <Hero />

      {/* 02 — What is Nemara */}
      <section className="manifesto section" aria-labelledby="manifesto-title">
        <div className="wrap">
          <p className="eyebrow">What is Nemara?</p>
          <Lines as="h2" className="h1 manifesto__title" lines={[<>She has never been</>, <><em>just one</em> person.</>]} />
          <div className="manifesto__grid">
            <Reveal className="reveal manifesto__versions" delay={100}>
              {["Bold at nine.", "Quiet by noon.", "Ambitious on Tuesdays.", "Playful when no one is looking.", "Celebrating something, somewhere.", "Different, every single day."].map((v, i) => (
                <p key={v} className="manifesto__v" style={{ ["--i" as string]: i }}>{v}</p>
              ))}
            </Reveal>
            <Reveal className="reveal manifesto__body" delay={250}>
              <p className="lede">Nemara is a jewellery house for all of her. Each piece is drawn by our founder, Pratima Saxena, made by a named Indian artist, and designed to move with whichever version of you walks out of the door.</p>
              <p className="hand">her jewellery should keep up. — P.</p>
              <Link href="/our-story" className="link-arrow">Meet the woman with the purple pen</Link>
            </Reveal>
          </div>
        </div>
      </section>

      <NemaraWorld />
      <Moments occasions={occasions} />
      <StoryTeaser product={storyPiece} artist={storyArtist} />

      {/* New arrivals */}
      <section className="section--tight" aria-labelledby="new-title">
        <div className="wrap section-head">
          <div><p className="eyebrow">Just out of the kiln</p><h2 id="new-title" className="h2">New this edition</h2></div>
          <Link href="/shop/new-arrivals" className="link-arrow">See all</Link>
        </div>
        <div className="wrap"><ProductRail products={newest} label="New arrivals" /></div>
      </section>

      {/* Category index */}
      <section className="section" aria-labelledby="cat-title">
        <div className="wrap">
          <div className="section-head"><div><p className="eyebrow">The index</p><h2 id="cat-title" className="h2">Shop by piece</h2></div></div>
          <CategoryIndex categories={categories} counts={counts} />
        </div>
      </section>

      {/* Founder */}
      <section className="founder section" aria-labelledby="founder-title">
        <div className="wrap founder__grid">
          <Reveal className="reveal-crop founder__img arch">
            <Image src={SITE.founder.portrait.src} alt={SITE.founder.portrait.alt} fill sizes="(min-width: 900px) 40vw, 90vw" unoptimized />
          </Reveal>
          <div className="founder__copy">
            <p className="eyebrow">The founder</p>
            <Lines as="h2" className="h1" lines={["Twenty-five years", "of teaching.", <em key="e">One purple pen.</em>]} />
            <p className="lede">Pratima Saxena spent a quarter of a century noticing what made each student different. Then she picked up the same purple pen and began drawing jewellery — for every kind of woman she had ever taught.</p>
            <blockquote className="pull">“Red is a correction. Purple is a conversation.”</blockquote>
            <Link href="/our-story" className="btn btn--ghost">Read her story</Link>
          </div>
        </div>
      </section>

      {/* Try it on */}
      <section className="tryon-promo" aria-labelledby="tryon-title">
        <div className="wrap tryon-promo__grid">
          <div>
            <p className="eyebrow tryon-promo__ed">Try it on</p>
            <h2 id="tryon-title" className="h1">See it on you<br /><em>before it&apos;s yours.</em></h2>
            <p className="tryon-promo__lede">Turn on your camera and try any Nemara piece — earrings at your ears, sets at your neck, kadas at your wrist. Nothing leaves your device.</p>
            <Link href="/try-on" className="btn btn--light">Open the try-on mirror</Link>
          </div>
          <div className="tryon-promo__mirror arch" aria-hidden="true">
            <Image src="/art/campaign/after-hours.svg" alt="" fill sizes="40vw" unoptimized />
          </div>
        </div>
      </section>

      {/* Artists */}
      <section className="section" aria-labelledby="artists-title">
        <div className="wrap">
          <div className="section-head">
            <div><p className="eyebrow">The hands behind the pieces</p><h2 id="artists-title" className="h2">Made by people.<br />Credited by name.</h2></div>
            <Link href="/artists" className="link-arrow">Meet the artists</Link>
          </div>
          <ul className="artist-row">
            {artists.map((a, i) => (
              <Reveal as="li" key={a.slug} delay={i * 90}>
                <Link href={`/artists/${a.slug}`} className="artist-chip">
                  <div className="frame ratio-34 arch"><Image src={a.portrait.src} alt={a.portrait.alt} fill sizes="(min-width: 900px) 22vw, 45vw" unoptimized /></div>
                  <h3 className="h3">{a.name}</h3>
                  <p className="muted">{a.craft}</p>
                  <p className="eyebrow">{a.location}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Stylist */}
      <section className="stylist-promo section--tight" aria-labelledby="stylist-title">
        <div className="wrap stylist-promo__inner">
          <p className="eyebrow">Nemara Stylist <span className="pill">Preview</span></p>
          <h2 id="stylist-title" className="h2">Tell us where you&apos;re going.<br /><em>We&apos;ll tell you what to wear.</em></h2>
          <StylistPrompt />
        </div>
      </section>
    </div>
  );
}
