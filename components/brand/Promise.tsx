import Link from "next/link";
import { FloralLily, FloralSprig } from "./Florals";
import { Lockup } from "./Logo";

/* Line icons from the brand card. */
const IconDiamond = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M8 18l7-9h18l7 9-16 21z" /><path d="M8 18h32M15 9l5 9 4-9 4 9 5-9M20 18l4 21 4-21" />
    <path d="M42 6v6M39 9h6M43 30v4M41 32h4" strokeLinecap="round" />
  </svg>
);
const IconSeal = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M24 4l4.3 3.1 5.3-.4 1.9 5 4.7 2.5-.9 5.2 2.7 4.6-2.7 4.6.9 5.2-4.7 2.5-1.9 5-5.3-.4L24 44l-4.3-3.1-5.3.4-1.9-5-4.7-2.5.9-5.2L6 24l2.7-4.6-.9-5.2 4.7-2.5 1.9-5 5.3.4z" />
    <path d="M17 24.5l5 5 9-10" strokeLinecap="round" />
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <rect x="7" y="10" width="34" height="31" rx="4" /><path d="M7 19h34M16 6v8M32 6v8" strokeLinecap="round" />
    {[[18, 27], [24, 27], [30, 27], [18, 33], [24, 33], [30, 33]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="currentColor" stroke="none" />)}
  </svg>
);

export const PROMISES = [
  { icon: IconDiamond, label: ["Curated", "Designs"] },
  { icon: IconSeal, label: ["Assured", "Quality"] },
  { icon: IconCalendar, label: ["3 Months", "Warranty"] },
];

/** The three promises as a compact row (product page, checkout). */
export function PromiseRow({ className = "" }: { className?: string }) {
  return (
    <ul className={`promise-row ${className}`}>
      {PROMISES.map(({ icon: Icon, label }) => (
        <li key={label.join(" ")}><Icon /><span>{label[0]} {label[1]}</span></li>
      ))}
    </ul>
  );
}

/** The brand card, as a page section: thanks, promises, and Pratima's note. */
export function PromiseCard() {
  return (
    <section className="promise section" aria-labelledby="promise-title">
      <div className="wrap">
        <div className="promise__card">
          <FloralSprig className="promise__floral promise__floral--tl" />
          <FloralLily className="promise__floral promise__floral--br" />
          <Lockup className="promise__lockup" tagline />
          <h2 id="promise-title" className="promise__thanks">Thank you for choosing Nemara <span aria-hidden="true">♡</span></h2>
          <p className="promise__body">Every piece at Nemara is thoughtfully curated to be a beautiful part of your every occasion — from everyday moments to life’s special celebrations.</p>
          <ul className="promise__list">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li key={label.join(" ")}><Icon /><span>{label[0]}<br />{label[1]}</span></li>
            ))}
          </ul>
          <p className="promise__divider" aria-hidden="true"><span>♥</span></p>
          <p className="promise__love">With love,</p>
          <p className="promise__sign" aria-hidden="true">Pratima</p>
          <p className="promise__who"><b>Pratima Saxena</b><br />Founder, Nemara</p>
          <Link href="/info/warranty" className="text-link promise__terms">Warranty &amp; care terms</Link>
        </div>
      </div>
    </section>
  );
}
