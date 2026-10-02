import { NextResponse } from "next/server";
import { z } from "zod";
import { style } from "@/lib/stylist";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ message: z.string().trim().min(1).max(1000) });

export async function POST(req: Request) {
  if (!rateLimit(`stylist:${clientIp(req)}`, 30)) return NextResponse.json({ error: "Give me a moment." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Tell me a little about the occasion." }, { status: 400 });
  return NextResponse.json(await style(parsed.data.message));
}
