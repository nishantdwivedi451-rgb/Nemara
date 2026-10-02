import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/editorial/JsonLd";
import { getJournal, getJournalEntry } from "@/lib/content";
import { siteUrl } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };
export async function generateStaticParams() { return (await getJournal()).map((e) => ({ slug: e.slug })); }
export async function generateMetadata({ params }: Params) {
  const e = await getJournalEntry((await params).slug);
  return e ? pageMeta({ title: e.title, description: e.excerpt, path: `/journal/${e.slug}`, image: e.cover.src }) : {};
}

export default async function Entry({ params }: Params) {
  const e = await getJournalEntry((await params).slug);
  if (!e) notFound();
  return (
    <article className="page-enter entry">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: e.title, datePublished: e.date, author: { "@type": "Person", name: e.author }, image: `${siteUrl()}${e.cover.src}`, publisher: { "@type": "Organization", name: "Nemara" } }} />
      <header className="wrap entry__head">
        <nav aria-label="Breadcrumb" className="crumbs"><Link href="/journal">Journal</Link> / <span aria-current="page">{e.kind}</span></nav>
        <p className="eyebrow">{e.kind} · {e.author} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        <h1 className="h1">{e.title}</h1>
        <p className="lede">{e.excerpt}</p>
      </header>
      <div className="wrap"><div className="frame ratio-169 entry__cover"><Image src={e.cover.src} alt={e.cover.alt} fill priority sizes="100vw" unoptimized /></div></div>
      <div className="wrap entry__body prose">
        {e.body.map((b, i) => b.type === "quote" ? <blockquote key={i} className="pull">{b.text}</blockquote> : b.type === "h" ? <h2 key={i} className="h3">{b.text}</h2> : <p key={i} className={i === 0 ? "dropcap" : ""}>{b.text}</p>)}
        <p className="hand">— {e.author}</p>
        <Link href="/journal" className="link-arrow">More from the journal</Link>
      </div>
    </article>
  );
}
