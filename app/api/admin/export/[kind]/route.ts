import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/session";
import { customers, getMembers, getOrders, getVisitors, toCsv } from "@/lib/admin/data";
import { loadCatalogueFresh } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) return new Response("Unauthorized", { status: 401 });
  const { kind } = await params;
  const url = new URL(req.url);
  let rows: Record<string, unknown>[] = [];
  if (kind === "orders") rows = (await getOrders()).map((o) => ({ reference: o.reference, date: o.createdAt, status: o.status, name: o.customer.name, phone: o.customer.phone, email: o.customer.email, city: o.customer.city, state: o.customer.state, pincode: o.customer.pincode, items: o.items.map((i) => `${i.quantity}× ${i.sku}`).join(" | "), subtotal: o.subtotal, shipping: o.shipping, total: o.total, courier: o.tracking?.courier ?? "", tracking: o.tracking?.number ?? "", demo: o.demo }));
  else if (kind === "members") {
    const festival = url.searchParams.get("festival");
    rows = (await getMembers()).filter((m) => !festival || !m.contacted?.[festival]).map((m) => ({ code: m.code, name: m.name, phone: m.phone, email: m.email, birthday: m.birthday ?? "", city: m.city ?? "", joined: m.createdAt, source: m.source, consent: m.consent }));
  }
  else if (kind === "customers") rows = (await customers()).map((c) => ({ name: c.name, phone: c.phone, email: c.email, city: c.city ?? "", circle_code: c.member?.code ?? "", birthday: c.birthday ?? "", orders: c.orders, spend: c.spend, last_order: c.lastOrder ?? "" }));
  else if (kind === "visitors") rows = (await getVisitors()).map((v) => ({ engaged_at: v.engagedAt, visitor: v.visitorId, landing: v.landing, pages: v.pages.length, referrer: v.referrer ?? "", utm_source: v.utm?.utm_source ?? "", utm_campaign: v.utm?.utm_campaign ?? "", device: v.device, browser: v.browser ?? "", city: v.city ?? "", country: v.country ?? "", returning: v.returning }));
  else if (kind === "products" || kind === "inventory") rows = (await loadCatalogueFresh()).map((p) => ({ sku: p.sku, handle: p.handle, name: p.name, category: p.category, price: p.price, inventory: p.inventory, low_stock_at: p.lowStockAt ?? 5, status: p.status ?? "active", exclusive: !!p.exclusive, artist: p.artist }));
  else return new Response("Unknown export", { status: 404 });
  return new Response("﻿" + toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="nemara-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
