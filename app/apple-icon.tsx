import { ImageResponse } from "next/og";
import { LOTUS_PATHS } from "@/components/brand/Logo";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#4A1A5C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="124" height="73" viewBox="2 2 116 68" fill="none" stroke="#F4EDF7" strokeWidth="4" strokeLinejoin="round">{LOTUS_PATHS.map((d) => <path key={d} d={d} />)}</svg>
    </div>, size);
}
