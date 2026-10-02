import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: "#4B1D5C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="96" height="126" viewBox="-15 -30 100 140"><path d="M0 0h4v100H0zM66 0h4v100h-4zM0 0h16l54 100H54z" fill="#FCFAF6" /><circle cx="68" cy="-16" r="9" fill="#C8B184" /></svg>
    </div>, size);
}
