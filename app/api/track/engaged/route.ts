import { NextResponse } from "next/server";
import { z } from "zod";
import { recordEngaged } from "@/lib/marketing";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { storeConfigured } from "@/lib/store";

const schema = z.object({
  visitorId: z.string().regex(/^[a-z0-9-]{8,64}$/),
  startedAt: z.string().max(40),
  landing: z.string().max(300),
  pages: z.array(z.string().max(300)).max(40),
  referrer: z.string().max(300).optional(),
  utm: z.record(z.string(), z.string().max(120)).optional(),
  returning: z.boolean(),
});
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor/i;

/** Records one engaged session (≥ the configured dwell time). One write per session keeps storage costs flat. */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });
  if (!storeConfigured()) return NextResponse.json({ ok: true, skipped: "no-store" });
  if (!rateLimit(`eng:${clientIp(req)}`, 6)) return NextResponse.json({ ok: true, skipped: "rate" });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const h = req.headers;
  const dec = (v: string | null) => (v ? decodeURIComponent(v) : undefined);
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop";
  const browser = /edg\//i.test(ua) ? "Edge" : /chrome|crios/i.test(ua) ? "Chrome" : /safari/i.test(ua) ? "Safari" : /firefox|fxios/i.test(ua) ? "Firefox" : "Other";
  try {
    await recordEngaged({ ...parsed.data, engagedAt: new Date().toISOString(), device, browser, country: dec(h.get("x-vercel-ip-country")), region: dec(h.get("x-vercel-ip-country-region")), city: dec(h.get("x-vercel-ip-city")) });
  } catch (e) { console.error("[track] failed", e); }
  return NextResponse.json({ ok: true });
}
