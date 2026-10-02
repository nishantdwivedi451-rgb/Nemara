"use client";
// Modular analytics: one `track()` call fans out to every configured adapter.
// GA4 (NEXT_PUBLIC_GA_ID) and Meta Pixel (NEXT_PUBLIC_META_PIXEL_ID) are wired in
// components/analytics/AnalyticsScripts.tsx; add more adapters below.

export type AnalyticsEvent =
  | "page_view" | "view_item" | "search" | "view_category" | "try_on_started" | "try_on_completed"
  | "add_to_cart" | "begin_checkout" | "purchase" | "add_to_wishlist" | "whatsapp_click" | "artist_story_view"
  | "stylist_query" | "newsletter_signup";

type Props = Record<string, string | number | boolean | undefined | null | object>;
type Adapter = (event: AnalyticsEvent, props: Props) => void;

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void }
}

const META_MAP: Partial<Record<AnalyticsEvent, string>> = {
  view_item: "ViewContent", search: "Search", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout",
  purchase: "Purchase", add_to_wishlist: "AddToWishlist", newsletter_signup: "Lead",
};

const adapters: Adapter[] = [
  (e, p) => { if (typeof window !== "undefined") (window.dataLayer ||= []).push({ event: e, ...p }); },
  (e, p) => { if (typeof window !== "undefined" && window.gtag && e !== "page_view") window.gtag("event", e, p); },
  (e, p) => { const m = META_MAP[e]; if (typeof window !== "undefined" && window.fbq) m ? window.fbq("track", m, p) : window.fbq("trackCustom", e, p); },
  (e, p) => { if (process.env.NODE_ENV !== "production") console.debug("[analytics]", e, p); },
];

export function registerAnalyticsAdapter(a: Adapter) { adapters.push(a); }

export function track(event: AnalyticsEvent, props: Props = {}) {
  for (const a of adapters) { try { a(event, props); } catch { /* never break UX for analytics */ } }
}
