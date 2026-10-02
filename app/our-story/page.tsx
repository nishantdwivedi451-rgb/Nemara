import Image from "next/image";
import Link from "next/link";
import { Reveal, Lines } from "@/components/editorial/Reveal";
import { SITE } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Our Story", description: "Twenty-five years of teaching, one purple pen, and a jewellery house built with Indian artists. The story of Pratima Saxena and Nemara.", path: "/our-story" });

const CHAPTERS = [
  { n: "25", k: "Twenty-five years", h: <>A classroom is a room<br />full of <em>different people.</em></>, img: "/art/campaign/nine-to-five.svg",
    body: ["For twenty-five years, Pratima Saxena stood at the front of a classroom. She taught grammar and literature, but mostly she taught attention: how to look closely at something until it told you what it was.", "She learned that no two students were alike. The loud ones and the quiet ones, the ones who drew in the margins, the ones who asked the question everyone else was thinking. Her job was to notice each of them."],
    note: "every child had a version of themselves they hadn't shown anyone yet." },
  { n: "∞", k: "The passion", h: <>She had always<br /><em>drawn jewellery.</em></>, img: "/art/products/monsoon-hour-jhumka/story.svg",
    body: ["On the backs of attendance sheets, in the margins of lesson plans, on the last page of every diary: earrings, collars, a kada that looked like a courtyard. Always in the same purple ink.", "For years the drawings stayed in drawers. There was always another term, another batch, another exam."],
    note: "the drawer was full before I admitted it was a plan." },
  { n: "1", k: "The shift", h: <>One term, she<br /><em>didn&apos;t go back.</em></>, img: "/art/campaign/founder.svg",
    body: ["After twenty-five years, Pratima did the bravest thing a teacher can do: she became a student again. She learned metals and finishes, costing and casting. She failed at things. She asked questions in workshops where nobody expected a former principal to be taking notes.", "It was not a retirement. It was a second first day."],
    note: "a second first day." },
  { n: "✎", k: "The designer", h: <>Design, the way<br /><em>a teacher thinks.</em></>, img: "/art/products/raat-rani-necklace-set/story.svg",
    body: ["Pratima designs the way she taught: start with the person, simplify the idea, then test it until it holds. Every Nemara piece begins with a question — who is she, where is she going, what does she want to feel?", "She is suspicious of anything that only looks good on a tray. If it doesn't sit beautifully on a body, it is redrawn."],
    note: "if it only looks good on a tray, it isn't finished." },
  { n: "4", k: "The artists", h: <>The hands she<br /><em>went looking for.</em></>, img: "/art/artists/meher-bano.svg",
    body: ["She travelled to Jaipur, Cuttack, Thrissur and Moradabad — to enamellers, filigree workers, chasers and brass finishers — and asked them to make things they had never been asked to make.", "Some laughed. Most said yes. Today every Nemara piece carries the name of the artist who made it, because Pratima believes that a story without its storyteller is only half told."],
    note: "if I can't tell you who made it, I won't sell it." },
  { n: "N", k: "The brand", h: <>And so,<br /><em>Nemara.</em></>, img: "/art/campaign/hero.svg",
    body: ["Nemara is what happens when a teacher's eye, an artist's hands and a modern woman's life meet on the same page. Jewellery that is designed with intention, made with people, born in India, and made for her — every version of her."],
    note: "wear your story." },
  { n: "∴", k: "The belief", h: <>Women, and the<br /><em>people who make.</em></>, img: "/art/campaign/celebration.svg",
    body: ["Nemara exists to back two groups Pratima has always believed in: women who are told to be one thing, and India's makers, who are too often left uncredited.", "Every purchase pays an artist fairly, credits them publicly and keeps a craft in practice. That is the part of the story you wear without seeing."],
    note: "the part of the story you wear without seeing." },
];

export default function OurStory() {
  return (
    <div className="page-enter story-page">
      <header className="story-hero">
        <div className="wrap story-hero__grid">
          <div>
            <p className="eyebrow edition"><b>✎</b> Our story</p>
            <Lines as="h1" className="display" lines={["Twenty-five", "years. One", <em key="p">purple pen.</em>]} />
            <p className="lede">The story of Pratima Saxena — teacher, designer, founder — and the jewellery house she built with India&apos;s artists.</p>
          </div>
          <div className="story-hero__img arch frame"><Image src={SITE.founder.portrait.src} alt={SITE.founder.portrait.alt} fill priority sizes="(min-width: 900px) 40vw, 90vw" unoptimized /></div>
        </div>
      </header>

      {CHAPTERS.map((c, i) => (
        <section key={c.k} className={`chapter ${i % 2 ? "is-flip" : ""}`} aria-labelledby={`ch-${i}`}>
          <div className="wrap chapter__grid">
            <div className="chapter__label"><span className="chapter__n">{c.n}</span><span className="eyebrow">{String(i + 1).padStart(2, "0")} — {c.k}</span></div>
            <div className="chapter__copy">
              <Reveal as="h2" className="reveal h1" id={`ch-${i}`}>{c.h}</Reveal>
              <Reveal className="reveal prose" delay={120}>{c.body.map((b, j) => <p key={j}>{b}</p>)}</Reveal>
              <Reveal className="reveal" delay={220}><p className="hand chapter__note">{c.note}</p></Reveal>
            </div>
            <Reveal className="reveal-crop chapter__img frame ratio-45"><Image src={c.img} alt="" fill sizes="(min-width: 900px) 30vw, 90vw" unoptimized /></Reveal>
          </div>
        </section>
      ))}

      <section className="story-end section">
        <div className="wrap story-end__inner">
          <p className="hand">— and now, your chapter.</p>
          <h2 className="h1">Find the piece that<br /><em>sounds like you.</em></h2>
          <div className="story-end__ctas"><Link href="/shop" className="btn">Explore Nemara</Link><Link href="/artists" className="btn btn--ghost">Meet the artists</Link></div>
        </div>
      </section>
    </div>
  );
}
