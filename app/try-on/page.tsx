import { TryOnStudio } from "@/components/tryon/TryOnStudio";
import { toPiece } from "@/lib/tryon/piece";
import { commerce } from "@/lib/commerce";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Try It On", description: "Try Nemara earrings, necklace sets, bracelets and kadas live with your camera — private, on-device, instant.", path: "/try-on" });

type SP = { searchParams: Promise<{ piece?: string }> };

export default async function TryOnPage({ searchParams }: SP) {
  const { piece } = await searchParams;
  const products = (await commerce.getProducts()).filter((p) => p.tryOn?.supported);
  return (
    <div className="page-enter tryon-page">
      <header className="wrap tryon-page__head">
        <p className="eyebrow">The Nemara mirror</p>
        <h1 className="h1">See it on you, <em>then decide.</em></h1>
        <p className="lede">Earrings follow your ears, sets settle at your neck, kadas find your wrist. Switch pieces, compare, take a snapshot. Nothing leaves your device.</p>
      </header>
      <div className="wrap"><TryOnStudio pieces={products.map(toPiece)} initial={piece} /></div>
      <section className="wrap tryon-page__how" aria-label="How it works">
        <div><h2 className="h3">Private by design</h2><p className="muted">Tracking runs entirely in your browser. No uploads, no recordings, nothing stored.</p></div>
        <div><h2 className="h3">Tracks as you move</h2><p className="muted">Earrings and sets follow your face; bracelets and kadas follow your hand. Prefer to place it yourself? Tap Adjust.</p></div>
        <div><h2 className="h3">Snap and share</h2><p className="muted">Save a Nemara snapshot or send it straight to WhatsApp, then add the piece to your bag.</p></div>
      </section>
    </div>
  );
}
