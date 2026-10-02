// Best-effort in-memory limiter for serverless endpoints (per instance). For strict limits,
// back this with Vercel KV / Upstash — see docs/ARCHITECTURE.md.
const hits = new Map<string, { n: number; t: number }>();
export function rateLimit(key: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.t > windowMs) { hits.set(key, { n: 1, t: now }); return true; }
  h.n += 1;
  if (hits.size > 5000) hits.clear();
  return h.n <= max;
}
export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
