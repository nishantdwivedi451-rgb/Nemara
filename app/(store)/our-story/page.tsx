import Image from "next/image";
import Link from "next/link";
import { Reveal, Lines } from "@/components/editorial/Reveal";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Our Story — Curated across India", description: "Nemara handpicks premium fashion jewellery from India's most loved markets — Jaipur, Delhi, Srinagar, Hyderabad, Mumbai and Ahmedabad — checks every piece, and styles it for real life.", path: "/our-story" });

const CHAPTERS = [
  { k: "The idea", h: <>India has the best<br /><em>jewellery markets</em> in the world.</>, img: "/art/markets/jaipur.svg",
    body: ["Johari Bazaar for meenakari. Dariba Kalan for statement collars. Laad Bazaar for pearls. Colaba Causeway for the everyday. Every city has a market with its own signature — and most of us will never get to shop them all.", "Even when you do, it's a gamble: two hours of bargaining, a hundred near-identical trays, and no way to know if the plating will last past the wedding."],
    note: "what if someone did the hunting for you?" },
  { k: "The route", h: <>So we go.<br /><em>Season after season.</em></>, img: "/art/markets/kashmir.svg",
    body: ["Our buyers walk six markets every season — Jaipur, Old Delhi, Srinagar, Hyderabad, Mumbai and Ahmedabad — and we're already scouting Kolkata, Chennai and Lucknow.", "We go early, before the lanes fill. We drink a lot of chai. We find the small counters with the workshop upstairs, and the stalls that change their stock every week."],
    note: "the best pieces are never on the front counter." },
  { k: "The pick", h: <>One in fifty<br /><em>makes it.</em></>, img: "/products/rajwada-kada/06.webp",
    body: ["We pick for three things: is it beautiful, will you actually wear it, and does it feel like now. A jhumka that's too heavy to dance in doesn't make it. Neither does a trend that's already everywhere.", "Sometimes we ask for one change — a lighter dome, a softer colour, a stronger clasp — and wait for the sample."],
    note: "it chimes when you laugh." },
  { k: "The check", h: <>Checked like<br /><em>fine jewellery.</em></>, img: "/art/campaign/studio.svg",
    body: ["Markets are where the magic is. They're also where quality varies the most. So every piece comes through our checking table before it reaches you.", "Plating under bright light. Stones and pearls pushed, twisted and matched. Clasps opened and closed until we trust them. Earrings weighed for comfort. Every edge that touches skin, smoothed. If a batch fails, we drop the design — however pretty it is."],
    note: "and then we back it for 3 months." },
  { k: "The style", h: <>Styled for<br /><em>your actual life.</em></>, img: "/products/petal-drop-earrings/02.webp",
    body: ["Every piece comes with how to wear it — what to pair it with, where it works, what to leave off. Try anything on with your camera before you buy, or ask the Nemara Stylist where you're going.", "The 9 to 5. The brunch. The sangeet. The date you're overthinking. There's a piece for each — and most work for all of them."],
    note: "office to dinner, no change needed." },
  { k: "The price", h: <>Premium,<br /><em>not precious.</em></>, img: "/products/riptide-coil-bracelet/02.webp",
    body: ["Nemara is premium fashion jewellery: the look and finish of fine jewellery, at a price that lets you build a whole wardrobe instead of buying one piece and saving it for best.", "Wear it on a Tuesday. Wear it to the wedding. Lend it to your best friend."],
    note: "the best jewellery is the one you actually wear." },
  { k: "The wardrobe", h: <>Your jewellery<br /><em>wardrobe.</em></>, img: "/products/rajwada-temple-set/02.webp",
    body: ["That's the whole idea: a jewellery wardrobe, built one find at a time, from every corner of India. Each piece arrives in a Nemara pouch with a card telling you which market it came from — so your jewellery comes with a story.", "Join the Nemara Circle for first look at every new market edit, plus a gift on your birthday and the big festivals."],
    note: "wear your story." },
];

export default function OurStory() {
  return (
    <div className="page-enter story-page">
      <header className="story-hero">
        <div className="wrap story-hero__grid">
          <div>
            <p className="eyebrow">Our story</p>
            <Lines as="h1" className="display" lines={["Curated", "across", <em key="p">India.</em>]} />
            <p className="lede">Nemara handpicks premium fashion jewellery from India&apos;s most loved markets, checks every piece, and styles it for the many versions of you.</p>
          </div>
          <div className="story-hero__img"><Image src="/art/markets/delhi.svg" alt="Illustration of Old Delhi's domes above Dariba Kalan" fill priority sizes="(min-width: 900px) 40vw, 90vw" unoptimized /></div>
        </div>
      </header>

      {CHAPTERS.map((c, i) => (
        <section key={c.k} className={`chapter ${i % 2 ? "is-flip" : ""}`} aria-labelledby={`ch-${i}`}>
          <div className="wrap chapter__grid">
            <div className="chapter__label"><span className="eyebrow">{c.k}</span></div>
            <div className="chapter__copy">
              <Reveal as="h2" className="reveal h1" id={`ch-${i}`}>{c.h}</Reveal>
              <Reveal className="reveal prose" delay={120}>{c.body.map((b, j) => <p key={j}>{b}</p>)}</Reveal>
              <Reveal className="reveal" delay={220}><p className="chapter__note">“{c.note.charAt(0).toUpperCase() + c.note.slice(1)}”</p></Reveal>
            </div>
            <Reveal className="reveal-crop chapter__img frame ratio-45"><Image src={c.img} alt="" fill sizes="(min-width: 900px) 30vw, 90vw" unoptimized /></Reveal>
          </div>
        </section>
      ))}

      <section className="story-end section">
        <div className="wrap story-end__inner">
          <p className="hand">— and now, your wardrobe.</p>
          <h2 className="h1">Find the piece that<br /><em>sounds like you.</em></h2>
          <div className="story-end__ctas"><Link href="/shop" className="btn">Shop the edit</Link><Link href="/markets" className="btn btn--ghost">Explore the markets</Link></div>
        </div>
      </section>
    </div>
  );
}
