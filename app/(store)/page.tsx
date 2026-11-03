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
import { PromiseCard } from "@/components/brand/Promise";
import { commerce } from "@/lib/commerce";
import { getMarkets, getMarket } from "@/lib/content";

export default async function Home() {
  const [all, newest, categories, occasions, markets] = await Promise.all([
    commerce.getProducts(), commerce.getProducts({ sort: "newest", limit: 8 }), commerce.getCategories(), commerce.getOccasions(), getMarkets(),
  ]);
  const storyPiece = all.find((p) => p.handle === "monsoon-hour-jhumka") ?? all[0];
  const storyMarket = await getMarket(storyPiece.market);
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
              <p className="lede">Nemara is your jewellery wardrobe — premium fashion jewellery handpicked from India&apos;s most loved markets, checked piece by piece, and styled to move with whichever version of you walks out of the door.</p>
              <p className="hand">one wardrobe. every version of you.</p>
              <Link href="/our-story" className="link-arrow">How we curate</Link>
            </Reveal>
          </div>
        </div>
      </section>

      <NemaraWorld />
      <Moments occasions={occasions} />
      <StoryTeaser product={storyPiece} market={storyMarket} />

      {/* New arrivals */}
      <section className="section--tight" aria-labelledby="new-title">
        <div className="wrap section-head">
          <h2 id="new-title" className="h2">New arrivals</h2>
          <Link href="/shop/new-arrivals" className="link-arrow">See all</Link>
        </div>
        <div className="wrap"><ProductRail products={newest} label="New arrivals" /></div>
      </section>

      {/* Category index */}
      <section className="section" aria-labelledby="cat-title">
        <div className="wrap">
          <div className="section-head"><h2 id="cat-title" className="h2">Shop by piece</h2></div>
          <CategoryIndex categories={categories} counts={counts} />
        </div>
      </section>

      {/* The Nemara experience */}
      <section className="experience section" aria-labelledby="exp-title">
        <div className="wrap">
          <div className="section-head"><div><p className="eyebrow">The Nemara experience</p><h2 id="exp-title" className="h2">We do the hunting.<br /><em>You do the wearing.</em></h2></div>
            <Link href="/our-story" className="link-arrow">Our story</Link></div>
          <ol className="experience__steps">
            {[
              ["Scout", "Six of India's most famous jewellery markets, every season — Jaipur to Srinagar."],
              ["Handpick", "One in fifty pieces makes the edit. Beautiful, wearable and right for now."],
              ["Check", "Plating, stones, clasps, comfort and edges — checked like fine jewellery."],
              ["Style", "Every piece comes with how to wear it. Try it on with your camera first."],
              ["Deliver", "In a Nemara pouch with its market story — and a 3-month warranty."],
            ].map(([k, v], i) => (
              <Reveal as="li" key={k} delay={i * 90}><span className="experience__n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3 className="h3">{k}</h3><p>{v}</p></Reveal>
            ))}
          </ol>
        </div>
      </section>

      <PromiseCard />

      {/* Try it on */}
      <section className="tryon-promo" aria-labelledby="tryon-title">
        <div className="wrap tryon-promo__grid">
          <div>
            <h2 id="tryon-title" className="h1">See it on you<br /><em>before it&apos;s yours.</em></h2>
            <p className="tryon-promo__lede">Turn on your camera and try any Nemara piece — earrings at your ears, sets at your neck, kadas at your wrist. Nothing leaves your device.</p>
            <Link href="/try-on" className="btn btn--light">Open the try-on mirror</Link>
          </div>
          <div className="tryon-promo__mirror arch" aria-hidden="true">
            <Image src="/art/campaign/after-hours.svg" alt="" fill sizes="40vw" unoptimized />
          </div>
        </div>
      </section>

      {/* Markets */}
      <section className="section" aria-labelledby="markets-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="markets-title" className="h2">Shop by market</h2>
            <Link href="/markets" className="link-arrow">Explore the markets</Link>
          </div>
          <ul className="market-row">
            {markets.map((m, i) => (
              <Reveal as="li" key={m.slug} delay={i * 70}>
                <Link href={`/markets/${m.slug}`} className="market-chip">
                  <div className="market-chip__img"><Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width: 900px) 16vw, 45vw" unoptimized /></div>
                  <h3 className="h3">{m.city}</h3>
                  <p className="muted">{m.signature}</p>
                  <p className="eyebrow">{m.market}</p>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Stylist */}
      <section className="stylist-promo section--tight" aria-labelledby="stylist-title">
        <div className="wrap stylist-promo__inner">
          <p className="eyebrow">Nemara Stylist</p>
          <h2 id="stylist-title" className="h2">Tell us where you&apos;re going.<br /><em>We&apos;ll tell you what to wear.</em></h2>
          <StylistPrompt />
        </div>
      </section>
    </div>
  );
}
