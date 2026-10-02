import { ImageResponse } from "next/og";
export const alt = "Nemara — Wear Your Story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#F7F3EC", display: "flex", padding: 72, position: "relative", fontFamily: "serif" }}>
      <div style={{ position: "absolute", right: 90, top: 60, width: 380, height: 570, background: "#B9A4C8", opacity: 0.55, borderRadius: "190px 190px 0 0" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
        <div style={{ fontSize: 26, letterSpacing: 12, color: "#4B1D5C" }}>NEMARA</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 128, lineHeight: 0.9, color: "#21102A" }}>
          <span>Wear your</span><span style={{ fontStyle: "italic", color: "#4B1D5C" }}>story.</span>
        </div>
        <div style={{ fontSize: 26, color: "#5A5260", fontFamily: "sans-serif" }}>Jewellery designed in India, shaped by artists.</div>
      </div>
    </div>, size);
}
