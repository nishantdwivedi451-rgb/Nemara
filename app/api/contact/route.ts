import { NextResponse } from "next/server";
import { z } from "zod";
import { notify } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  email: z.email("Please enter a valid email").max(120),
  topic: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "A few more words, please").max(2000),
  company: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 5)) return NextResponse.json({ error: "Too many messages — please try again shortly." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return NextResponse.json({ error: "Please check the form.", fields }, { status: 400 });
  }
  const { company: _hp, ...data } = parsed.data;
  await notify("contact", data);
  return NextResponse.json({ ok: true });
}
