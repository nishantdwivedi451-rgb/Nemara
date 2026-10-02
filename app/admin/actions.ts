"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, verifyCredentials } from "@/lib/admin/auth";
import { SESSION_COOKIE, SESSION_TTL, signSession } from "@/lib/admin/session";
import { rateLimit } from "@/lib/rate-limit";
import { adjustStock, loadCatalogueFresh, removeProduct, upsertProduct, type StoredProduct } from "@/lib/catalogue";
import { getOrder, saveOrder, ORDER_STATUSES, type OrderStatus } from "@/lib/oms";
import { getMarketingSettingsFresh, saveMarketingSettings, type MarketingSettings, type Member } from "@/lib/marketing";
import { store, safeId, newestId } from "@/lib/store";

/* ───────── auth ───────── */
export async function login(_: unknown, fd: FormData): Promise<{ error?: string; email?: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const email = String(fd.get("email") ?? ""), password = String(fd.get("password") ?? "");
  if (!rateLimit(`login:${ip}`, 5, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes.", email };
  if (!process.env.ADMIN_SESSION_SECRET || !process.env.ADMIN_PASSWORD_HASH) return { error: "Studio login is not configured on this deployment.", email };
  if (!verifyCredentials(email, password)) return { error: "That email and password don't match.", email };
  (await cookies()).set(SESSION_COOKIE, await signSession(email.trim().toLowerCase()), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL,
  });
  const next = String(fd.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ───────── media ───────── */
const IMG_TYPES = ["image/webp", "image/png", "image/jpeg", "image/svg+xml", "image/gif"];
export async function uploadImage(fd: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File)) return { error: "No file" };
  if (!IMG_TYPES.includes(file.type)) return { error: "Use a JPG, PNG, WebP or SVG image" };
  if (file.size > 4 * 1024 * 1024) return { error: "Image is over 4 MB — it will be compressed automatically if you re-select it" };
  const folder = safeId(String(fd.get("folder") ?? "uploads"));
  const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1].replace("jpeg", "jpg");
  const name = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const url = await store().putFile(name, await file.arrayBuffer(), file.type);
  return { url };
}

/* ───────── products ───────── */
const img = z.object({ src: z.string().min(1).max(500), alt: z.string().max(200), role: z.string().max(20) });
const productSchema = z.object({
  previousHandle: z.string().optional(),
  handle: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  sku: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  subtitle: z.string().max(120).optional().default(""),
  description: z.string().min(10, "Add a short description").max(1000),
  price: z.number().int().min(1).max(10_00_000),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  inventory: z.number().int().min(0).max(100000),
  lowStockAt: z.number().int().min(0).max(1000).optional(),
  category: z.string().min(1),
  occasions: z.array(z.string()).default([]),
  collections: z.array(z.string()).default([]),
  tags: z.array(z.string().max(40)).max(30).default([]),
  material: z.string().max(300).default(""),
  dimensions: z.string().max(300).default(""),
  care: z.string().max(500).default(""),
  artist: z.string().max(80).default(""),
  featured: z.boolean().default(false),
  exclusive: z.boolean().default(false),
  status: z.enum(["active", "draft"]).default("active"),
  images: z.array(img).min(1, "Add at least the main product image").max(8),
  story: z.object({
    idea: z.object({ body: z.string().max(1500).default(""), note: z.string().max(200).optional() }),
    hand: z.object({ contribution: z.string().max(1000).default(""), quote: z.string().max(300).optional() }),
    making: z.object({ body: z.string().max(1500).default(""), steps: z.array(z.string().max(80)).max(8).optional() }),
    moment: z.object({ body: z.string().max(800).default("") }),
  }),
  variants: z.array(z.object({ title: z.string().max(20), sku: z.string().max(60) })).max(12).default([]),
  tryOn: z.object({ supported: z.boolean(), anchor: z.enum(["ears", "neck", "wrist"]), overlay: z.string().max(500), scale: z.number().min(0.3).max(3).optional(), arAsset: z.null().optional() }).nullable(),
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<{ ok?: true; handle?: string; error?: string; fields?: Record<string, string> }> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] ||= i.message;
    return { error: "Please fix the highlighted fields.", fields };
  }
  const d = parsed.data;
  const all = await loadCatalogueFresh();
  if ((!d.previousHandle || d.previousHandle !== d.handle) && all.some((p) => p.handle === d.handle)) return { error: "Another piece already uses this URL handle.", fields: { handle: "Already in use" } };
  if (all.some((p) => p.sku === d.sku && p.handle !== (d.previousHandle ?? d.handle))) return { error: "Another piece already uses this SKU.", fields: { sku: "Already in use" } };
  const existing = all.find((p) => p.handle === (d.previousHandle ?? d.handle));
  const product = {
    ...(existing ?? {}),
    id: existing?.id ?? `nem_${Date.now().toString(36)}`,
    handle: d.handle, sku: d.sku, name: d.name, subtitle: d.subtitle, description: d.description,
    price: d.price, compareAtPrice: d.compareAtPrice ?? null, currency: "INR", inventory: d.inventory, lowStockAt: d.lowStockAt,
    category: d.category, occasions: d.occasions, collections: d.collections, tags: d.tags,
    material: d.material, dimensions: d.dimensions, care: d.care, artist: d.artist,
    featured: d.featured, exclusive: d.exclusive, status: d.status,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    images: d.images, story: d.story, variants: d.variants,
    tryOn: d.tryOn ? { ...d.tryOn, arAsset: null } : { supported: false, anchor: "ears", overlay: "", arAsset: null },
    seo: existing?.seo ?? { title: null, description: null },
  } as StoredProduct;
  const admin = await requireAdmin();
  await upsertProduct(product, d.previousHandle);
  if (existing && existing.inventory !== d.inventory) {
    // log manual stock edits made from the product form
    await store().put("stock_moves", newestId(), { handle: d.handle, sku: d.sku, delta: d.inventory - existing.inventory, after: d.inventory, reason: "Edited in product form", at: new Date().toISOString(), by: admin.email });
  }
  revalidatePath("/admin/products");
  return { ok: true, handle: d.handle };
}

export async function deleteProduct(handle: string) {
  await requireAdmin();
  await removeProduct(handle);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function setProductStatus(handle: string, status: "active" | "draft") {
  await requireAdmin();
  const all = await loadCatalogueFresh();
  const p = all.find((x) => x.handle === handle);
  if (!p) return;
  await upsertProduct({ ...p, status });
  revalidatePath("/admin/products");
}

/* ───────── inventory ───────── */
export async function adjustInventory(fd: FormData) {
  const s = await requireAdmin();
  const handle = String(fd.get("handle")), mode = String(fd.get("mode")), qty = Math.trunc(Number(fd.get("qty")));
  const reason = String(fd.get("reason") || (mode === "set" ? "Stock count" : "Manual adjustment")).slice(0, 80);
  if (!handle || !Number.isFinite(qty)) return;
  const p = (await loadCatalogueFresh()).find((x) => x.handle === handle);
  if (!p) return;
  const delta = mode === "set" ? qty - p.inventory : qty;
  if (delta) await adjustStock([{ handle, delta, reason }], s.email, true);
  revalidatePath("/admin/inventory");
}

/* ───────── orders ───────── */
export async function updateOrder(fd: FormData) {
  const s = await requireAdmin();
  const o = await getOrder(String(fd.get("id")));
  if (!o) return;
  const status = String(fd.get("status") ?? o.status) as OrderStatus;
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const courier = String(fd.get("courier") ?? "").trim().slice(0, 60), number = String(fd.get("trackingNumber") ?? "").trim().slice(0, 80), url = String(fd.get("trackingUrl") ?? "").trim().slice(0, 300);
  const now = new Date().toISOString();
  if (ORDER_STATUSES.includes(status) && status !== o.status) {
    // returning stock when an order is cancelled/refunded before it ships
    if ((status === "cancelled" || status === "refunded") && !["cancelled", "refunded", "shipped", "delivered"].includes(o.status)) {
      await adjustStock(o.items.map((i) => ({ handle: i.handle, delta: i.quantity, reason: `Order ${status}`, ref: o.reference })), s.email, true);
    }
    o.status = status;
    o.timeline.push({ at: now, status, by: s.email });
  }
  if (courier || number || url) o.tracking = { courier: courier || o.tracking?.courier, number: number || o.tracking?.number, url: url || o.tracking?.url };
  if (note) o.timeline.push({ at: now, status: "note", note, by: s.email });
  await saveOrder(o);
  revalidatePath(`/admin/orders/${o.id}`);
  revalidatePath("/admin/orders");
}

/* ───────── marketing ───────── */
export async function saveMarketing(fd: FormData) {
  await requireAdmin();
  const cur = await getMarketingSettingsFresh();
  const lines = (v: FormDataEntryValue | null) => String(v ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const festivals = lines(fd.get("festivals")).map((l) => { const [date, ...name] = l.split("|"); return { date: date.trim(), name: name.join("|").trim() }; })
    .filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f.date) && f.name).sort((a, b) => a.date.localeCompare(b.date));
  const next: MarketingSettings = {
    ...cur,
    popup: {
      enabled: fd.get("enabled") === "on",
      delaySeconds: Math.min(120, Math.max(5, Number(fd.get("delaySeconds")) || 15)),
      eyebrow: String(fd.get("eyebrow") || cur.popup.eyebrow).slice(0, 60),
      title: String(fd.get("title") || cur.popup.title).slice(0, 120),
      body: String(fd.get("body") || cur.popup.body).slice(0, 300),
      benefits: lines(fd.get("benefits")).slice(0, 6),
      cta: String(fd.get("cta") || cur.popup.cta).slice(0, 60),
      consentText: String(fd.get("consentText") || cur.popup.consentText).slice(0, 400),
      showExclusives: fd.get("showExclusives") === "on",
    },
    festivals: festivals.length ? festivals : cur.festivals,
    birthdayMessage: String(fd.get("birthdayMessage") || cur.birthdayMessage).slice(0, 600),
    festivalMessage: String(fd.get("festivalMessage") || cur.festivalMessage).slice(0, 600),
    abandonedMessage: String(fd.get("abandonedMessage") || cur.abandonedMessage).slice(0, 600),
  };
  await saveMarketingSettings(next);
  revalidatePath("/admin/marketing");
}

export async function markContacted(memberId: string, campaign: string) {
  await requireAdmin();
  const m = await store().get<Member>("members", memberId);
  if (!m) return;
  m.contacted = { ...(m.contacted ?? {}), [campaign]: new Date().toISOString() };
  await store().put("members", m.id, m);
  revalidatePath("/admin/marketing");
}
