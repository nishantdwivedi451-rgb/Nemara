import { notFound } from "next/navigation";
import info from "@/content/info.json";
import { SITE, contact, hasPhone } from "@/lib/site";
import { pageMeta } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };
type Info = Record<string, { title: string; body: string[] }>;

/** Policies reference the business details once ({{business}}, {{email}}…) so they never drift from content/site.json. */
const TOKENS: Record<string, string> = {
  business: SITE.legal.business, grievanceOfficer: SITE.legal.grievanceOfficer, jurisdiction: SITE.legal.jurisdiction, updated: SITE.legal.updated,
  email: contact.email, phone: contact.phone, address: contact.address, hours: contact.hours,
  reach: [contact.email, hasPhone ? contact.phone : ""].filter(Boolean).join(" or "),
  contactLine: [SITE.legal.business, contact.address, contact.email, hasPhone ? contact.phone : "", contact.hours].filter(Boolean).join(" · "),
};
const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => TOKENS[k] ?? "");

export function generateStaticParams() { return Object.keys(info).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: Params) {
  const d = (info as Info)[(await params).slug];
  return d ? pageMeta({ title: d.title, description: fill(d.body.find((b) => !b.startsWith("Last updated") && !b.startsWith("## ")) ?? d.title), path: `/info/${(await params).slug}` }) : {};
}
export default async function InfoPage({ params }: Params) {
  const d = (info as Info)[(await params).slug];
  if (!d) notFound();
  return (
    <div className="page-enter">
      <header className="wrap page-head"><p className="eyebrow">Help</p><h1 className="h1">{d.title}</h1></header>
      <div className="wrap prose info-body">
        {d.body.map((p, i) => p.startsWith("## ")
          ? <h2 key={i} className="h3 info-body__h">{p.slice(3)}</h2>
          : <p key={i} className={p.startsWith("Last updated") ? "muted" : undefined}>{fill(p)}</p>)}
      </div>
    </div>
  );
}
