import { NextResponse } from "next/server";

/** Short link printed as the QR on Story Tag stickers → product page, tagged so scans show in Studio › Visitors. */
export async function GET(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const handle = (await params).handle.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const url = new URL(handle ? `/product/${handle}` : "/shop", req.url);
  url.search = "utm_source=tag&utm_medium=qr&utm_campaign=story-tag";
  return NextResponse.redirect(url, 308);
}
