import { notFound } from "next/navigation";
import info from "@/content/info.json";
import { pageMeta } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };
type Info = Record<string, { title: string; body: string[] }>;
export function generateStaticParams() { return Object.keys(info).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Params) {
  const d = (info as Info)[(await params).slug];
  return d ? pageMeta({ title: d.title, description: d.body[0], path: `/info/${(await params).slug}` }) : {};
}
export default async function InfoPage({ params }: Params) {
  const d = (info as Info)[(await params).slug];
  if (!d) notFound();
  return (
    <div className="page-enter">
      <header className="wrap page-head"><p className="eyebrow">Help</p><h1 className="h1">{d.title}</h1></header>
      <div className="wrap prose info-body">{d.body.map((p, i) => <p key={i}>{p}</p>)}</div>
    </div>
  );
}
