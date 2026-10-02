import site from "@/content/site.json";

/** Absolute site URL. Never hard-coded: custom domain via NEXT_PUBLIC_SITE_URL, else Vercel's production URL. */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const SITE = site;

/** Preview mode shows the slim "placeholder content" ribbon and labels demo payments. */
export const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE !== "false";

export const contact = {
  ...site.contact,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || site.contact.phone,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || site.contact.email,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || site.contact.whatsapp,
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || site.contact.instagram,
};

export const whatsappUrl = (text = contact.whatsappMessage) =>
  `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= site.shipping.freeShippingThreshold ? 0 : site.shipping.flatRate;
}
