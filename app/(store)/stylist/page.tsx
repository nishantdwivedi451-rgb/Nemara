import { Suspense } from "react";
import { StylistChat } from "@/components/stylist/StylistChat";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Nemara Stylist", description: "Tell the Nemara Stylist where you're going and what you're wearing — get a personal jewellery edit you can try on instantly.", path: "/stylist" });

export default function StylistPage() {
  return (
    <div className="page-enter stylist-page">
      <header className="wrap page-head">
        <p className="eyebrow">Nemara Stylist <span className="pill">Preview</span></p>
        <h1 className="h1">Where are you going?<br /><em>What are you wearing?</em></h1>
        <p className="lede">Describe the occasion, the outfit and your budget. The Stylist reads the whole edition and puts together a look you can try on straight away.</p>
      </header>
      <div className="wrap"><Suspense fallback={null}><StylistChat /></Suspense></div>
    </div>
  );
}
