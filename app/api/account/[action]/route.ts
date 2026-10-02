import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { storeConfigured, newestId } from "@/lib/store";
import { deliverOtp, type Channel } from "@/lib/otp-delivery";
import {
  checkOtp, currentCustomer, detectChannel, endSession, findCustomer, issueOtp, normTarget, readRegToken,
  saveCustomer, signRegToken, startSession, toPublic, customerIdForPhone, normEmail, type Customer, type SavedAddress,
} from "@/lib/customers";
import { getOrder, STATUS_LABEL } from "@/lib/oms";
import { normPhone } from "@/lib/marketing";

const json = (d: unknown, status = 200) => NextResponse.json(d, { status, headers: { "Cache-Control": "no-store" } });
const bad = (error: string, status = 400) => json({ error }, status);

async function send(channel: Channel, target: string, ip: string) {
  if (!rateLimit(`otp-ip:${ip}`, 10, 60 * 60_000) || !rateLimit(`otp-t:${target}`, 5, 60 * 60_000)) return { error: "Too many codes requested. Please try again later.", status: 429 };
  const r = await issueOtp(channel, target);
  if ("wait" in r) return { error: `Please wait ${r.wait}s before requesting another code.`, status: 429 };
  const how = await deliverOtp(channel, target, r.code);
  return { sent: true, channel, ...(how === "dev" ? { devCode: r.code } : {}) };
}
const otpError = (r: string) => (r === "expired" ? "That code has expired — request a new one." : r === "locked" ? "Too many attempts — request a new code." : "That code isn't right. Please check and try again.");

const address = z.object({
  id: z.string().max(40).optional(), label: z.string().trim().max(30).default("Home"),
  name: z.string().trim().min(2).max(80), phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid mobile"),
  line1: z.string().trim().min(3).max(160), line2: z.string().trim().max(160).optional().default(""),
  city: z.string().trim().min(2).max(80), state: z.string().trim().min(2).max(80), pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid PIN code"),
  isDefault: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!storeConfigured()) return json({ customer: null, available: false });
  const c = await currentCustomer();
  if (action === "me") return json({ customer: c ? toPublic(c) : null, available: true });
  if (action === "orders") {
    if (!c) return bad("Please sign in", 401);
    const orders = (await Promise.all(c.orderIds.slice(0, 50).map((id) => getOrder(id)))).filter(Boolean);
    return json({ orders: orders.map((o) => ({ id: o!.id, reference: o!.reference, status: o!.status, statusLabel: STATUS_LABEL[o!.status], total: o!.total, createdAt: o!.createdAt, items: o!.items.map((i) => ({ name: i.name, quantity: i.quantity, handle: i.handle })), tracking: o!.tracking })) });
  }
  return bad("Not found", 404);
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!storeConfigured()) return bad("Accounts open soon.", 503);
  const ip = clientIp(req);
  const body = await req.json().catch(() => ({}));
  try {
    switch (action) {
      /* step 1: enter mobile or email → code */
      case "start": {
        const raw = String(body.identifier ?? "");
        const channel = detectChannel(raw);
        if (!channel) return bad("Enter a valid 10-digit mobile number or email address.");
        const target = normTarget(channel, raw);
        const r = await send(channel, target, ip);
        if ("error" in r) return bad(r.error!, r.status);
        return json({ ...r, target, exists: !!(await findCustomer(channel, target)) });
      }
      /* step 2: verify → signed in, or proof for registration */
      case "verify": {
        const channel = detectChannel(String(body.identifier ?? ""));
        if (!channel || !/^\d{6}$/.test(String(body.code ?? ""))) return bad("Enter the 6-digit code.");
        if (!rateLimit(`verify:${ip}`, 20, 15 * 60_000)) return bad("Too many attempts. Please wait a few minutes.", 429);
        const target = normTarget(channel, String(body.identifier));
        const r = await checkOtp(channel, target, String(body.code));
        if (r !== "ok") return bad(otpError(r));
        const existing = await findCustomer(channel, target);
        if (existing) {
          existing.lastLoginAt = new Date().toISOString();
          if (channel === "email") existing.emailVerified = true; else existing.phoneVerified = true;
          await saveCustomer(existing);
          await startSession(existing);
          return json({ status: "signed_in", customer: toPublic(existing) });
        }
        return json({ status: "register", regToken: signRegToken(channel, target), channel, target });
      }
      /* step 3 (new customers): name + the other contact → code */
      case "register-start": {
        const reg = readRegToken(String(body.regToken ?? ""));
        if (!reg) return bad("Your verification expired — please start again.", 401);
        const other: Channel = reg.channel === "phone" ? "email" : "phone";
        const raw = String(body.other ?? "");
        if (detectChannel(raw) !== other) return bad(other === "email" ? "Enter a valid email address." : "Enter a valid 10-digit mobile number.");
        const target = normTarget(other, raw);
        if (await findCustomer(other, target)) return bad(other === "email" ? "This email already belongs to an account — sign in with it instead." : "This mobile already belongs to an account — sign in with it instead.", 409);
        const r = await send(other, target, ip);
        if ("error" in r) return bad(r.error!, r.status);
        return json({ ...r, target });
      }
      /* step 4: verify the second code → account created, signed in */
      case "register-complete": {
        const reg = readRegToken(String(body.regToken ?? ""));
        if (!reg) return bad("Your verification expired — please start again.", 401);
        const name = String(body.name ?? "").trim();
        if (name.length < 2 || name.length > 80) return bad("Please tell us your name.");
        const other: Channel = reg.channel === "phone" ? "email" : "phone";
        const target = normTarget(other, String(body.other ?? ""));
        const r = await checkOtp(other, target, String(body.code ?? ""));
        if (r !== "ok") return bad(otpError(r));
        const phone = reg.channel === "phone" ? reg.target : target, email = reg.channel === "email" ? reg.target : target;
        const now = new Date().toISOString();
        const c: Customer = { id: customerIdForPhone(phone), name, phone: normPhone(phone), email: normEmail(email), phoneVerified: true, emailVerified: true, addresses: [], wishlist: Array.isArray(body.wishlist) ? body.wishlist.slice(0, 100) : [], orderIds: [], createdAt: now, lastLoginAt: now, marketingConsent: !!body.consent };
        await saveCustomer(c);
        await startSession(c);
        return json({ status: "signed_in", customer: toPublic(c), created: true });
      }
      case "logout": { await endSession(); return json({ ok: true }); }
      case "addresses": {
        const c = await currentCustomer();
        if (!c) return bad("Please sign in", 401);
        if (body.op === "delete") c.addresses = c.addresses.filter((a) => a.id !== body.id);
        else if (body.op === "default") c.addresses = c.addresses.map((a) => ({ ...a, isDefault: a.id === body.id }));
        else {
          const p = address.safeParse(body.address);
          if (!p.success) return json({ error: "Please check the address.", fields: Object.fromEntries(p.error.issues.map((i) => [String(i.path[0]), i.message])) }, 400);
          const a: SavedAddress = { ...p.data, phone: normPhone(p.data.phone), id: p.data.id ?? newestId().slice(-10) };
          const i = c.addresses.findIndex((x) => x.id === a.id);
          if (i >= 0) c.addresses[i] = a; else c.addresses.push(a);
          if (a.isDefault || c.addresses.length === 1) c.addresses = c.addresses.map((x) => ({ ...x, isDefault: x.id === a.id }));
          c.addresses = c.addresses.slice(0, 10);
        }
        await saveCustomer(c);
        return json({ customer: toPublic(c) });
      }
      case "wishlist": {
        const c = await currentCustomer();
        if (!c) return bad("Please sign in", 401);
        const items = z.array(z.object({ handle: z.string().max(120), name: z.string().max(160), price: z.number(), image: z.string().max(500) })).max(100).safeParse(body.items);
        if (!items.success) return bad("Invalid wishlist");
        c.wishlist = items.data;
        await saveCustomer(c);
        return json({ ok: true });
      }
      case "profile": {
        const c = await currentCustomer();
        if (!c) return bad("Please sign in", 401);
        const name = String(body.name ?? "").trim();
        if (name.length >= 2 && name.length <= 80) c.name = name;
        if (typeof body.marketingConsent === "boolean") c.marketingConsent = body.marketingConsent;
        await saveCustomer(c);
        return json({ customer: toPublic(c) });
      }
    }
  } catch (e) {
    console.error(`[account:${action}]`, e);
    return bad((e as Error).message || "Something went wrong. Please try again.", 500);
  }
  return bad("Not found", 404);
}
