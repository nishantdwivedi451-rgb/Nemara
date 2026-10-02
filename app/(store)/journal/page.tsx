import Image from "next/image";
import Link from "next/link";
import { getJournal } from "@/lib/content";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Journal", description: "Founder notes, behind-the-design stories, styling guides and the people who make Nemara.", path: "/journal" });

export default async function Journal() {
  const entries = await getJournal();
  const [lead, ...rest] = entries;
  return (
    <div className="page-enter">
      <header className="wrap page-head">
        <p className="eyebrow">The Journal</p>
        <h1 className="display">Notes from<br /><em>the margin.</em></h1>
      </header>
      <div className="wrap journal">
        {lead && (
          <Link href={`/journal/${lead.slug}`} className="jcard jcard--lead">
            <div className="frame ratio-169"><Image src={lead.cover.src} alt={lead.cover.alt} fill priority sizes="(min-width: 900px) 60vw, 100vw" unoptimized /></div>
            <div><p className="eyebrow">{lead.kind} · {new Date(lead.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p><h2 className="h1">{lead.title}</h2><p className="lede">{lead.excerpt}</p><span className="link-arrow">Read</span></div>
          </Link>
        )}
        <div className="journal__grid">
          {rest.map((e) => (
            <Link key={e.slug} href={`/journal/${e.slug}`} className="jcard">
              <div className="frame ratio-45"><Image src={e.cover.src} alt={e.cover.alt} fill sizes="(min-width: 900px) 40vw, 100vw" unoptimized /></div>
              <p className="eyebrow">{e.kind}</p><h2 className="h2">{e.title}</h2><p className="muted">{e.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
