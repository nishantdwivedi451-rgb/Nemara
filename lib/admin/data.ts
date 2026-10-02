import "server-only";
import { listAll, type Member, type VisitorSession, type Festival } from "@/lib/marketing";
import type { Checkout, Order } from "@/lib/oms";
import { loadCatalogueFresh } from "@/lib/catalogue";
import { normPhone } from "@/lib/marketing";

const DAY = 864e5;
const PAID: Order["status"][] = ["paid", "processing", "packed", "shipped", "delivered"];
export const isPaid = (o: Order) => PAID.includes(o.status);

export async function getOrders() { return listAll<Order>("orders"); }
export async function getMembers() { return listAll<Member>("members"); }
export async function getVisitors(max = 2000) { return listAll<VisitorSession>("visitors", max); }
export async function getCheckouts() { return listAll<Checkout>("checkouts", 500); }

export async function dashboard() {
  const [orders, members, visitors, catalogue] = await Promise.all([getOrders(), getMembers(), getVisitors(), loadCatalogueFresh()]);
  const since = (d: number) => Date.now() - d * DAY;
  const paid30 = orders.filter((o) => isPaid(o) && +new Date(o.createdAt) >= since(30));
  const revenue30 = paid30.reduce((s, o) => s + o.total, 0);
  const visitors30 = visitors.filter((v) => +new Date(v.engagedAt) >= since(30));
  const members30 = members.filter((m) => +new Date(m.createdAt) >= since(30));
  const lowStock = catalogue.filter((p) => p.status !== "draft" && p.inventory <= (p.lowStockAt ?? 5));
  const toShip = orders.filter((o) => ["paid", "processing", "packed"].includes(o.status));
  // daily revenue for the last 14 days
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * DAY); return d.toISOString().slice(0, 10); });
  const series = days.map((d) => ({ day: d, revenue: orders.filter((o) => isPaid(o) && o.createdAt.slice(0, 10) === d).reduce((s, o) => s + o.total, 0) }));
  return {
    revenue30, orders30: paid30.length, aov: paid30.length ? Math.round(revenue30 / paid30.length) : 0,
    toShip, lowStock, members: members.length, members30: members30.length,
    visitors30: visitors30.length, joinRate: visitors30.length ? members30.length / visitors30.length : 0,
    recentOrders: orders.slice(0, 6), series, catalogueSize: catalogue.length,
  };
}

export type Customer = { key: string; name: string; phone: string; email: string; city?: string; member?: Member; orders: number; spend: number; lastOrder?: string; birthday?: string };
export async function customers(): Promise<Customer[]> {
  const [orders, members] = await Promise.all([getOrders(), getMembers()]);
  const map = new Map<string, Customer>();
  for (const m of members) {
    const k = normPhone(m.phone) || m.email.toLowerCase();
    map.set(k, { key: k, name: m.name, phone: m.phone, email: m.email, city: m.city, member: m, orders: 0, spend: 0, birthday: m.birthday });
  }
  for (const o of orders.filter(isPaid)) {
    const k = normPhone(o.customer.phone) || o.customer.email.toLowerCase();
    const c = map.get(k) ?? { key: k, name: o.customer.name, phone: normPhone(o.customer.phone), email: o.customer.email, city: o.customer.city, orders: 0, spend: 0 };
    c.orders += 1; c.spend += o.total;
    if (!c.lastOrder || o.createdAt > c.lastOrder) c.lastOrder = o.createdAt;
    c.city ||= o.customer.city;
    map.set(k, c);
  }
  return [...map.values()].sort((a, b) => (b.lastOrder ?? b.member?.createdAt ?? "").localeCompare(a.lastOrder ?? a.member?.createdAt ?? ""));
}

/** Members whose birthday falls in the next `days` days (today first). */
export function upcomingBirthdays(members: Member[], days = 30) {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return members.filter((m) => m.birthday).map((m) => {
    const [mm, dd] = m.birthday!.split("-").map(Number);
    let next = new Date(today.getFullYear(), mm - 1, dd);
    if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) next = new Date(today.getFullYear() + 1, mm - 1, dd);
    const inDays = Math.round((+next - +new Date(today.getFullYear(), today.getMonth(), today.getDate())) / DAY);
    return { member: m, date: next, inDays };
  }).filter((x) => x.inDays <= days).sort((a, b) => a.inDays - b.inDays);
}

export function upcomingFestivals(festivals: Festival[], days = 60) {
  const today = new Date().toISOString().slice(0, 10);
  return festivals.filter((f) => f.date >= today).map((f) => ({ ...f, inDays: Math.round((+new Date(f.date) - +new Date(today)) / DAY) })).filter((f) => f.inDays <= days);
}

/** Checkouts older than an hour with no paid order for the same gateway order. */
export async function abandonedCheckouts(hours = 1, withinDays = 14) {
  const [checkouts, orders] = await Promise.all([getCheckouts(), getOrders()]);
  const paid = new Set(orders.map((o) => o.gatewayOrderId));
  const seen = new Set<string>();
  return checkouts.filter((c) => {
    const age = Date.now() - +new Date(c.createdAt);
    const k = normPhone(c.customer.phone);
    if (paid.has(c.gatewayOrderId) || age < hours * 36e5 || age > withinDays * DAY || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const waLink = (phone: string, text: string) => `https://wa.me/91${normPhone(phone)}?text=${encodeURIComponent(text)}`;

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}
