import { NextResponse } from "next/server";
import { commerce } from "@/lib/commerce";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 80).trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });
  const list = await commerce.getProducts({ q, limit: 8 });
  return NextResponse.json(
    { results: list.map((p) => ({ handle: p.handle, name: p.name, subtitle: p.subtitle, price: p.price, image: p.images[0]?.src })) },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
