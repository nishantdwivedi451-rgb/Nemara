import { ImageResponse } from "next/og";
import { LOTUS_PATHS } from "@/components/brand/Logo";
import { TAGLINE, WORDMARK } from "@/lib/brand/logo-paths";
export const alt = "Nemara — Your Jewellery Wardrobe";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card: the brand lockup on lilac paper, as on the printed card. */
export default function OG() {
  const ink = "#4A1A5C";
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #F8F2FB, #ECE1F3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: `2px solid ${ink}`, borderRadius: 28, display: "flex" }} />
      <svg width="230" height="135" viewBox="2 2 116 68" fill="none" stroke={ink} strokeWidth="3" strokeLinejoin="round">{LOTUS_PATHS.map((d) => <path key={d} d={d} />)}</svg>
      <svg width="640" height={(640 * WORDMARK.height) / WORDMARK.width} viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`} fill={ink}><path d={WORDMARK.d} /></svg>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ width: 70, height: 2, background: ink }} />
        <svg width="460" height={(460 * TAGLINE.height) / TAGLINE.width} viewBox={`0 0 ${TAGLINE.width} ${TAGLINE.height}`} fill={ink}><path d={TAGLINE.d} /></svg>
        <div style={{ width: 70, height: 2, background: ink }} />
      </div>
    </div>, size);
}
