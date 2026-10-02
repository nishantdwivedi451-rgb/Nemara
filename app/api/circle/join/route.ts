import { NextResponse } from "next/server";
import { z } from "zod";
import { getMarketingSettings, joinCircle } from "@/lib/marketing";
import { notify } from "@/lib/notify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { storeConfigured } from "@/lib/store";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(80),
  phone: z.string().trim().regex(/^(\+?91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z.email("Enter a valid email").max(120),
  birthday: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).optional().or(z.literal("")),
  consent: z.literal(true, { error: "Please accept to join" }),
  visitorId: z.string().max(64).optional(),
  page: z.string().max(300).optional(),
  utm: z.record(z.string(), z.string().max(120)).optional(),
  company: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  if (!storeConfigured()) return NextResponse.json({ error: "Membership sign-ups open soon." }, { status: 503 });
  if (!rateLimit(`circle:${clientIp(req)}`, 5)) return NextResponse.json({ error: "Please try again in a minute." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return NextResponse.json({ error: "Please check the highlighted details.", fields }, { status: 400 });
  }
  const d = parsed.data;
  const { popup } = await getMarketingSettings();
  try {
    const city = req.headers.get("x-vercel-ip-city");
    const { member, existing } = await joinCircle({
      name: d.name, phone: d.phone, email: d.email, birthday: d.birthday || undefined, city: city ? decodeURIComponent(city) : undefined,
      source: d.page ?? "/", visitorId: d.visitorId, utm: d.utm, consent: true, consentText: popup.consentText,
    });
    if (!existing) await notify("newsletter", { kind: "circle_member", code: member.code, name: member.name, phone: member.phone, email: member.email, birthday: member.birthday });
    return NextResponse.json({ ok: true, code: member.code, name: member.name.split(" ")[0], existing });
  } catch (e) {
    console.error("[circle] join failed", e);
    return NextResponse.json({ error: "We couldn't save that just now — please try again." }, { status: 500 });
  }
}
