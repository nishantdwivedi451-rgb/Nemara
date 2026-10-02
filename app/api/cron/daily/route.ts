import { getMembers, upcomingBirthdays, upcomingFestivals, dashboard } from "@/lib/admin/data";
import { getMarketingSettingsFresh } from "@/lib/marketing";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";

/** Daily digest (Vercel Cron, 09:00 IST): today's birthdays, festivals this week, low stock, orders to ship. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const [members, mk, d] = await Promise.all([getMembers(), getMarketingSettingsFresh(), dashboard()]);
  const birthdays = upcomingBirthdays(members, 3).map((b) => ({ name: b.member.name, phone: b.member.phone, inDays: b.inDays }));
  const festivals = upcomingFestivals(mk.festivals, 7);
  const digest = {
    date: new Date().toISOString().slice(0, 10), birthdays, festivals,
    lowStock: d.lowStock.map((p) => `${p.sku} (${p.inventory})`), toShip: d.toShip.map((o) => o.reference),
    studio: "/admin/marketing",
  };
  if (birthdays.length || festivals.length || d.lowStock.length || d.toShip.length) await notify("contact", { kind: "daily_digest", ...digest });
  return Response.json({ ok: true, ...digest });
}
