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
        <p className="eyebrow edition"><b>◎</b> The Nemara mirror</p>
        <h1 className="h1">Try it on.<br /><em>Then decide.</em></h1>
        <p className="lede">Earrings follow your ears, sets settle at your neck, kadas find your wrist. Switch pieces, take a snapshot, send it to your sister. Nothing leaves your device.</p>
      </header>
      <div className="wrap"><TryOnStudio pieces={products.map(toPiece)} initial={piece} /></div>
      <section className="wrap tryon-page__how">
        <div><span className="eyebrow">01</span><h2 className="h3">Allow your camera</h2><p className="muted">Your browser asks first. Tracking runs on-device with no uploads, recordings or storage.</p></div>
        <div><span className="eyebrow">02</span><h2 className="h3">Choose a piece</h2><p className="muted">Earrings and sets track your face; bracelets and kadas track your hand. If you&apos;d rather place it yourself, drag it into place.</p></div>
        <div><span className="eyebrow">03</span><h2 className="h3">Snap, share, decide</h2><p className="muted">Save a snapshot or share it straight to WhatsApp, then add to bag.</p></div>
      </section>
    </div>
  );
}
