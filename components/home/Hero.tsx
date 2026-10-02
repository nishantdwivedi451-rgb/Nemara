import Link from "next/link";
import Image from "next/image";
import { VersionTicker } from "./VersionTicker";
import { SITE } from "@/lib/site";

type Media = { type: "video"; src: string; poster?: string } | { type: "image"; src: string; alt?: string } | null;

/** Campaign hero. Default: an ink drawing whose earring resolves from sketch to gold. Swap for photo/video in content/site.json. */
export function Hero() {
  const media = SITE.hero.media as Media;
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__grid wrap">
        <div className="hero__copy">
          <p className="eyebrow edition hero__edition"><b>01</b> The First Edition · Autumn–Winter 2026</p>
          <h1 id="hero-title" className="display hero__title">
            <span className="hero__line"><span>Wear</span></span>
            <span className="hero__line"><span>your</span></span>
            <span className="hero__line"><span><em>story.</em></span></span>
          </h1>
          <p className="hero__sub">Jewellery designed in India, shaped by artists, and made for the many versions of you.</p>
          <VersionTicker />
          <div className="hero__ctas">
            <Link href="/shop" className="btn">Explore Nemara</Link>
            <Link href="/our-story" className="btn btn--ghost">Discover the story</Link>
          </div>
        </div>

        <div className="hero__visual">
          {media?.type === "video" ? (
            <video className="hero__media" src={media.src} poster={media.poster} autoPlay muted loop playsInline />
          ) : media?.type === "image" ? (
            <Image className="hero__media" src={media.src} alt={media.alt ?? ""} fill priority sizes="(min-width: 900px) 50vw, 100vw" />
          ) : (
            <HeroDrawing />
          )}
          <p className="hand hero__note" aria-hidden="true">first a line,<br />then a jhumka.</p>
          <Link href="/product/monsoon-hour-jhumka" className="hero__tag">
            <span className="eyebrow">Worn here</span>
            <span>Monsoon Hour Jhumka</span>
          </Link>
        </div>
      </div>
      <div className="hero__scroll" aria-hidden="true"><span /></div>
    </section>
  );
}

function HeroDrawing() {
  // Profile line drawing (original), arch, and an earring that draws itself in ink, then fills with gold.
  return (
    <svg className="hero__svg" viewBox="0 0 800 1000" role="img" aria-label="Ink drawing of a woman in profile wearing a lilac jhumka">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EED9A0" /><stop offset=".45" stopColor="#C9A253" /><stop offset="1" stopColor="#8E6E2E" /></linearGradient>
        <radialGradient id="hl" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#EDE2F4" /><stop offset=".6" stopColor="#B9A4C8" /><stop offset="1" stopColor="#8E77A3" /></radialGradient>
      </defs>
      <path className="hero__arch" d="M120 1000V330C120 180 330 70 400 30C470 70 680 180 680 330V1000Z" />
      <circle className="hero__sun" cx="200" cy="230" r="70" />
      <g className="hero__ink" fill="none" stroke="#4B1D5C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1}>
        <path pathLength={1} d="M520 230C565 245 592 290 598 340C600 360 598 372 602 384C615 410 638 440 650 466C654 476 646 484 634 488L616 492C620 500 624 508 618 516C612 520 612 526 618 530C622 540 616 552 602 558C606 580 600 604 574 616C540 630 490 618 458 580" />
        <path pathLength={1} d="M560 393C570 401 584 401 592 393" /><path pathLength={1} d="M556 372C570 364 588 366 598 373" />
        <path pathLength={1} d="M452 448C432 446 424 470 428 492C432 512 440 524 450 527C462 529 470 516 466 500C464 490 470 482 472 470C474 456 466 446 452 448Z" /><path pathLength={1} d="M448 466C440 476 442 494 452 500" />
        <path pathLength={1} d="M520 230C470 205 380 205 330 250C285 290 280 360 300 410" />
        <path pathLength={1} d="M300 300C240 290 210 340 230 385C248 425 300 425 318 395" /><path pathLength={1} d="M262 330C250 350 256 372 272 380" />
        <path pathLength={1} d="M590 332C560 292 520 300 470 330C430 355 420 400 432 440" />
        <path pathLength={1} d="M300 410C320 470 350 520 380 560" />
        <path pathLength={1} d="M560 618C556 680 556 740 566 800C572 840 590 870 620 900C680 920 740 940 820 952" />
        <path pathLength={1} d="M380 560C384 640 376 720 350 790C330 840 280 880 180 912" />
      </g>
      <g transform="translate(450 527) scale(2.1)">
        <g className="hero__jewel-sketch" fill="none" stroke="#6E3C8C" strokeWidth=".9">
          <circle pathLength={1} cx="0" cy="4" r="6.5" /><path pathLength={1} d="M-22 46C-22 25-12 15 0 15C12 15 22 25 22 46Z" /><ellipse pathLength={1} cx="0" cy="46" rx="22.5" ry="3.6" />
          <path pathLength={1} d="M-16 28C-8 22 8 22 16 28" />
        </g>
        <g className="hero__jewel">
          <circle cx="0" cy="4" r="6.5" fill="url(#hg)" /><circle cx="0" cy="4" r="3.4" fill="#6E3C8C" />
          <rect x="-1.4" y="10" width="2.8" height="6" fill="url(#hg)" />
          <path d="M-22 46C-22 25-12 15 0 15C12 15 22 25 22 46Z" fill="url(#hl)" stroke="#8E6E2E" strokeWidth=".8" />
          <path d="M-16 28C-8 22 8 22 16 28" fill="none" stroke="#C9A253" strokeWidth="1.4" />
          {[-14, -7, 0, 7, 14].map((x) => <circle key={x} cx={x} cy={34 - Math.abs(x) * 0.3} r="1.6" fill="#EED9A0" />)}
          <ellipse cx="0" cy="46" rx="22.5" ry="3.6" fill="url(#hg)" />
          <g className="hero__fringe">
            {Array.from({ length: 11 }, (_, k) => -20 + k * 4).map((x) => (
              <g key={x}><line x1={x} y1="47" x2={x} y2={x % 8 === 0 ? 59 : 55} stroke="#C9A253" strokeWidth=".8" /><circle cx={x} cy={x % 8 === 0 ? 61 : 57} r="1.9" fill={x % 8 === 0 ? "#6E3C8C" : "#B9A4C8"} /></g>
            ))}
          </g>
        </g>
      </g>
    </svg>
  );
}
