import "server-only";
import { unstable_cache, updateTag } from "next/cache";
import { createHash } from "node:crypto";
import { store, newestId } from "@/lib/store";

export type PopupSettings = {
  enabled: boolean;
  delaySeconds: number;
  eyebrow: string;
  title: string;
  body: string;
  benefits: string[];
  cta: string;
  consentText: string;
  showExclusives: boolean;
};
export type Festival = { name: string; date: string /* YYYY-MM-DD */ };
export type MarketingSettings = {
  popup: PopupSettings;
  festivals: Festival[];
  birthdayMessage: string;
  festivalMessage: string;
  abandonedMessage: string;
};

export const DEFAULT_MARKETING: MarketingSettings = {
  popup: {
    enabled: true,
    delaySeconds: 15,
    eyebrow: "The Nemara Circle",
    title: "Free lifetime membership, by invitation.",
    body: "Join the Circle for first look at members-only designs — and let us celebrate you, every year.",
    benefits: [
      "Members-only designs before anyone else",
      "A gift hamper on your birthday, on us",
      "Festival gifts for Diwali, Rakhi and more",
      "Private previews and early access to new editions",
    ],
    cta: "Join the Circle — it's free",
    consentText: "I agree to receive messages from Nemara on WhatsApp, SMS and email about my membership, gifts and offers. I can opt out anytime.",
    showExclusives: true,
  },
  // Lunar festival dates shift every year — verify and edit them in Nemara Studio → Marketing.
  festivals: [
    { name: "Navratri", date: "2026-10-11" }, { name: "Dussehra", date: "2026-10-20" }, { name: "Karwa Chauth", date: "2026-10-29" },
    { name: "Dhanteras", date: "2026-11-06" }, { name: "Diwali", date: "2026-11-08" }, { name: "Bhai Dooj", date: "2026-11-11" },
    { name: "Christmas", date: "2026-12-25" }, { name: "New Year", date: "2027-01-01" }, { name: "Makar Sankranti / Pongal", date: "2027-01-14" },
    { name: "Valentine's Day", date: "2027-02-14" }, { name: "Women's Day", date: "2027-03-08" }, { name: "Eid al-Fitr", date: "2027-03-10" },
    { name: "Holi", date: "2027-03-22" }, { name: "Mother's Day", date: "2027-05-09" }, { name: "Raksha Bandhan", date: "2027-08-17" },
  ],
  birthdayMessage: "Happy birthday, {name}! 🎉 Your Nemara Circle birthday hamper is on its way. Reply with your delivery address and we'll send it with love. — Team Nemara",
  festivalMessage: "Happy {festival}, {name}! ✨ As a Nemara Circle member, a festive gift is waiting for you. Reply to claim it. — Team Nemara",
  abandonedMessage: "Hi {name}, you left something beautiful in your Nemara bag ({items}). Need help choosing or a size check? Just reply here. — Team Nemara",
};

async function readSettings(): Promise<MarketingSettings> {
  try {
    const s = await store().get<Partial<MarketingSettings>>("settings", "marketing");
    if (s) return { ...DEFAULT_MARKETING, ...s, popup: { ...DEFAULT_MARKETING.popup, ...(s.popup ?? {}) } };
  } catch (e) { console.error("[marketing] settings read failed", e); }
  return DEFAULT_MARKETING;
}
export const getMarketingSettings = unstable_cache(readSettings, ["nemara-marketing-v1"], { tags: ["marketing"], revalidate: 600 });
export const getMarketingSettingsFresh = readSettings;
export async function saveMarketingSettings(s: MarketingSettings) {
  await store().put("settings", "marketing", s);
  updateTag("marketing");
}

/* ───────── Nemara Circle members ───────── */
export type Member = {
  id: string; code: string; name: string; phone: string; email: string; birthday?: string /* MM-DD */; city?: string;
  source: string; visitorId?: string; utm?: Record<string, string>; consent: true; consentText: string; consentAt: string;
  createdAt: string; notes?: string; contacted?: Record<string, string> /* campaignKey → ISO date */;
};
const key = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex").slice(0, 32);
export const normPhone = (p: string) => p.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").slice(-10);

export async function joinCircle(input: Omit<Member, "id" | "code" | "createdAt" | "consentAt">): Promise<{ member: Member; existing: boolean }> {
  const s = store();
  const phone = normPhone(input.phone);
  const idx = (await s.get<{ id: string }>("member_keys", key(phone))) ?? (await s.get<{ id: string }>("member_keys", key(input.email)));
  if (idx) {
    const m = await s.get<Member>("members", idx.id);
    if (m) {
      const merged = { ...m, name: input.name || m.name, email: input.email || m.email, birthday: input.birthday || m.birthday, city: input.city || m.city };
      await s.put("members", m.id, merged);
      return { member: merged, existing: true };
    }
  }
  const now = new Date().toISOString();
  const id = newestId();
  const member: Member = { ...input, phone, id, code: `NC-${id.slice(-6).toUpperCase()}`, createdAt: now, consentAt: now };
  await s.put("members", id, member);
  await Promise.all([s.put("member_keys", key(phone), { id }), s.put("member_keys", key(input.email), { id })]);
  return { member, existing: false };
}

/* ───────── engaged visitor sessions ───────── */
export type VisitorSession = {
  id: string; visitorId: string; startedAt: string; engagedAt: string; landing: string; pages: string[]; referrer?: string;
  utm?: Record<string, string>; device: "mobile" | "tablet" | "desktop"; browser?: string; country?: string; city?: string; region?: string;
  returning: boolean;
};
export async function recordEngaged(v: Omit<VisitorSession, "id">) {
  const id = newestId();
  await store().put("visitors", id, { ...v, id });
  return id;
}

/** Fetch every document in a collection (paged). Fine at boutique scale; Postgres recommended beyond. */
export async function listAll<T>(collection: string, max = 2000): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | undefined;
  do {
    const r = await store().list<T>(collection, { limit: 200, cursor });
    out.push(...r.items);
    cursor = r.cursor;
  } while (cursor && out.length < max);
  return out;
}

export const fillTemplate = (t: string, vars: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
