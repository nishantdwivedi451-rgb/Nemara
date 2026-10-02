import { NextResponse } from "next/server";
import { z } from "zod";
import { notify } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.email("Please enter a valid email").max(120), company: z.string().max(0).optional().nullable() });

export async function POST(req: Request) {
  if (!rateLimit(`nl:${clientIp(req)}`, 5)) return NextResponse.json({ error: "Please try again shortly." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please enter a valid email" }, { status: 400 });
  await notify("newsletter", { email: parsed.data.email });
  return NextResponse.json({ ok: true });
}
