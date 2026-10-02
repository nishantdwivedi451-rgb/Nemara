import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { normPhone } from "@/lib/marketing";
import type { Channel } from "@/lib/otp-delivery";

/* ───────── model ───────── */
export type SavedAddress = { id: string; label: string; name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; isDefault?: boolean };
export type WishEntry = { handle: string; name: string; price: number; image: string };
export type Customer = {
  id: string; name: string; phone: string; email: string; phoneVerified: boolean; emailVerified: boolean;
  addresses: SavedAddress[]; wishlist: WishEntry[]; orderIds: string[];
  createdAt: string; lastLoginAt?: string; marketingConsent?: boolean;
};
export type PublicCustomer = Omit<Customer, "orderIds">;

const secret = () => {
  const s = process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("CUSTOMER_SESSION_SECRET is not configured");
  return createHmac("sha256", s).update("nemara-customers-v1").digest(); // domain-separated from Studio sessions
};
const h = (v: string) => createHmac("sha256", secret()).update(v).digest("hex").slice(0, 40);
export const normEmail = (e: string) => e.trim().toLowerCase();
export const normTarget = (c: Channel, v: string) => (c === "email" ? normEmail(v) : normPhone(v));
export const customerIdForPhone = (phone: string) => `c_${h(`phone:${normPhone(phone)}`)}`;
export const detectChannel = (v: string): Channel | null => (/^\S+@\S+\.\S+$/.test(v.trim()) ? "email" : /^(\+?91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")) ? "phone" : null);

export async function getCustomer(id: string) { return store().get<Customer>("customers", id); }
export async function findCustomer(channel: Channel, target: string): Promise<Customer | null> {
  if (channel === "phone") return getCustomer(customerIdForPhone(target));
  const idx = await store().get<{ id: string }>("customer_emails", h(`email:${normEmail(target)}`));
  return idx ? getCustomer(idx.id) : null;
}
export async function saveCustomer(c: Customer) {
  await store().put("customers", c.id, c);
  await store().put("customer_emails", h(`email:${normEmail(c.email)}`), { id: c.id });
}
export const toPublic = ({ orderIds: _o, ...c }: Customer): PublicCustomer => c;

/* ───────── OTP ───────── */
type Otp = { codeHash: string; expiresAt: number; attempts: number; sentAt: number };
const OTP_TTL = 10 * 60_000, COOLDOWN = 30_000, MAX_ATTEMPTS = 5;

export async function issueOtp(channel: Channel, target: string): Promise<{ code: string } | { wait: number }> {
  const key = h(`otp:${channel}:${target}`);
  const prev = await store().get<Otp>("otps", key);
  if (prev && Date.now() - prev.sentAt < COOLDOWN) return { wait: Math.ceil((COOLDOWN - (Date.now() - prev.sentAt)) / 1000) };
  const code = String(randomInt(100000, 1000000));
  await store().put<Otp>("otps", key, { codeHash: h(`code:${code}`), expiresAt: Date.now() + OTP_TTL, attempts: 0, sentAt: Date.now() });
  return { code };
}

export async function checkOtp(channel: Channel, target: string, code: string): Promise<"ok" | "invalid" | "expired" | "locked"> {
  const key = h(`otp:${channel}:${target}`);
  const otp = await store().get<Otp>("otps", key);
  if (!otp || otp.expiresAt < Date.now()) return "expired";
  if (otp.attempts >= MAX_ATTEMPTS) return "locked";
  const a = Buffer.from(otp.codeHash), b = Buffer.from(h(`code:${code.trim()}`));
  if (a.length === b.length && timingSafeEqual(a, b)) { await store().del("otps", key); return "ok"; }
  await store().put("otps", key, { ...otp, attempts: otp.attempts + 1 });
  return otp.attempts + 1 >= MAX_ATTEMPTS ? "locked" : "invalid";
}

/* ───────── signed tokens & session ───────── */
export const CUSTOMER_COOKIE = "nemara_account";
const SESSION_DAYS = 30;
function sign(payload: object, ttlSec: number) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
function unsign<T>(token?: string | null): (T & { exp: number }) | null {
  if (!token?.includes(".")) return null;
  const [body, sig] = token.split(".");
  const want = createHmac("sha256", secret()).update(body).digest("base64url");
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString()) as T & { exp: number };
  return data.exp > Date.now() / 1000 ? data : null;
}
/** Short-lived proof that one contact was verified, used to finish registration. */
export const signRegToken = (channel: Channel, target: string) => sign({ t: "reg", channel, target }, 20 * 60);
export const readRegToken = (t: string) => { const d = unsign<{ t: string; channel: Channel; target: string }>(t); return d?.t === "reg" ? d : null; };

export async function startSession(c: Customer) {
  (await cookies()).set(CUSTOMER_COOKIE, sign({ t: "cust", id: c.id }, SESSION_DAYS * 86400), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400,
  });
}
export async function endSession() { (await cookies()).delete(CUSTOMER_COOKIE); }
export async function currentCustomer(): Promise<Customer | null> {
  try {
    const d = unsign<{ t: string; id: string }>((await cookies()).get(CUSTOMER_COOKIE)?.value);
    return d?.t === "cust" ? await getCustomer(d.id) : null;
  } catch { return null; }
}

/** Attach a paid order to the account with the same verified phone (works for both signed-in and guest checkouts). */
export async function attachOrder(phone: string, orderId: string) {
  const c = await getCustomer(customerIdForPhone(phone));
  if (!c || c.orderIds.includes(orderId)) return;
  c.orderIds = [orderId, ...c.orderIds].slice(0, 200);
  await store().put("customers", c.id, c);
}
