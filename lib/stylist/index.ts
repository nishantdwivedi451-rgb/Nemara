import "server-only";
import { commerce } from "@/lib/commerce";
import type { Product } from "@/lib/commerce/types";

/**
 * NEMARA STYLIST — engine interface. Today: a transparent rules engine over the live catalogue.
 * Tomorrow: an LLM engine (STYLIST_PROVIDER=ai) that receives the same brief + catalogue and
 * returns the same shape, so the chat UI, try-on links and analytics don't change.
 */
export type StylistBrief = { occasion?: string; outfit?: string; colour?: string; budget?: number; category?: string; metal?: "gold" | "silver"; raw: string };
export type StylistPick = { handle: string; name: string; price: number; image: string; reason: string; tryOn: boolean; needsSize: boolean };
export type StylistReply = { message: string; brief: StylistBrief; picks: StylistPick[]; followUps: string[] };

const OCC: [RegExp, string][] = [
  [/wedding|shaadi|sangeet|mehendi|haldi|puja|pooja|diwali|festive|festival|reception|engagement|karva|navratri|eid|celebrat/, "celebration"],
  [/office|work|meeting|interview|presentation|board|client|conference|9 ?to ?5/, "nine-to-five"],
  [/party|cocktail|dinner|date|club|night|drinks|gala|after ?hours|concert/, "after-hours"],
  [/daily|everyday|every day|college|brunch|casual|travel|market|weekend|coffee/, "everyday"],
];
const CAT: [RegExp, string][] = [[/earring|jhumka|hoop|drop|stud/, "earrings"], [/necklace|set|choker|collar/, "necklace-sets"], [/kada|bangle/, "kada"], [/bracelet|cuff/, "bracelets"]];
const COLOURS = ["black", "white", "ivory", "red", "maroon", "pink", "green", "emerald", "blue", "navy", "yellow", "mustard", "gold", "silver", "beige", "pastel", "lilac", "purple"];
const OUTFITS = ["saree", "sari", "lehenga", "kurta", "anarkali", "dress", "shirt", "suit", "jeans", "co-ord", "gown", "salwar"];

const OCC_LINE: Record<string, string> = {
  celebration: "For a celebration, let one piece lead and keep the rest quiet — Nemara pieces are made to be the conversation.",
  "nine-to-five": "For work, choose pieces that catch the light without catching on anything — clean lines, one considered detail.",
  "after-hours": "After dark, go a little braver: movement at the ear or a collar that holds the light when everything else is dim.",
  everyday: "Everyday pieces should be light, warm and easy to forget — until someone asks where they're from.",
};
const COLOUR_LINE: Record<string, string> = {
  black: "Black is the best canvas there is for gold and lilac — they'll glow against it.",
  white: "White and ivory love warm gold; add one touch of violet to keep it from feeling bridal.",
  ivory: "Ivory and gold are old friends — add one touch of violet so it feels like you, not a uniform.",
  red: "With red, stay with gold and let the piece's shape — not more colour — do the work.",
  maroon: "Maroon deepens beautifully with antique-toned gold and violet stones.",
  pink: "Pink and lilac enamel are a quietly unexpected pairing — trust it.",
  green: "Green wants gold. Keep stones minimal so the colour of the outfit leads.",
  emerald: "Emerald wants gold. Keep stones minimal so the colour of the outfit leads.",
  blue: "Blues and navy are wonderful with silver filigree — cool on cool, but textured.",
  navy: "Navy is wonderful with silver filigree — cool on cool, but textured.",
  yellow: "Yellow is festive already; choose sculptural gold over more colour.",
  mustard: "Mustard sings with violet — let a purple enamel detail be the surprise.",
  pastel: "Pastels pair naturally with lilac enamel and soft gold.",
  lilac: "Lilac on lilac, with gold, is very Nemara. Lean in.",
  purple: "Purple is our signature — pair it with gold, and you've worn it the Nemara way.",
};

export function parseBrief(raw: string): StylistBrief {
  const t = raw.toLowerCase();
  const budget = t.match(/(?:under|below|less than|within|upto|up to|max|<)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)\s*(k)?/);
  return {
    raw,
    occasion: OCC.find(([r]) => r.test(t))?.[1],
    category: CAT.find(([r]) => r.test(t))?.[1],
    colour: COLOURS.find((c) => new RegExp(`\\b${c}\\b`).test(t)),
    outfit: OUTFITS.find((o) => t.includes(o)),
    metal: /\bsilver\b|oxidi[sz]ed/.test(t) ? "silver" : /\bgold\b/.test(t) ? "gold" : undefined,
    budget: budget ? Number(budget[1].replace(/,/g, "")) * (budget[2] ? 1000 : 1) : undefined,
  };
}

const metalOf = (p: Product) => (/silver/i.test(p.material) ? "silver" : "gold");

export async function style(raw: string): Promise<StylistReply> {
  const brief = parseBrief(raw);
  let pool = await commerce.getProducts();
  if (brief.budget) pool = pool.filter((p) => p.price <= brief.budget!);
  pool = pool.filter((p) => p.availability !== "sold_out");
  const scored = pool.map((p) => {
    let s = p.featured ? 0.5 : 0;
    if (brief.occasion && p.occasions.includes(brief.occasion)) s += 3;
    if (brief.category && p.category === brief.category) s += 3;
    if (brief.metal && metalOf(p) === brief.metal) s += 2;
    if ((brief.occasion === "celebration" || brief.occasion === "after-hours") && p.collections.includes("statement")) s += 1;
    if ((brief.occasion === "nine-to-five" || brief.occasion === "everyday") && p.collections.includes("everyday-pieces")) s += 1;
    if (/gift/.test(raw.toLowerCase()) && p.collections.includes("giftable")) s += 2;
    if (brief.colour === "black" && /lilac|violet|enamel/.test(p.tags.join(" ") + p.material)) s += 1;
    return { p, s };
  }).sort((a, b) => b.s - a.s);

  // one piece per category where possible, so the edit reads like a look
  const picks: Product[] = [];
  for (const { p } of scored) {
    if (picks.length >= 3) break;
    if (brief.category || !picks.some((x) => x.category === p.category)) picks.push(p);
  }
  for (const { p } of scored) { if (picks.length >= 3) break; if (!picks.includes(p)) picks.push(p); }

  const parts = [
    brief.occasion ? OCC_LINE[brief.occasion] : "Tell me a little more — where you're going and what you're wearing — and I'll sharpen this edit.",
    brief.colour ? COLOUR_LINE[brief.colour] : brief.outfit ? `With a ${brief.outfit}, balance is everything: one hero piece, one supporting.` : "",
    brief.budget ? `Everything here is under ₹${brief.budget.toLocaleString("en-IN")}.` : "",
  ].filter(Boolean);

  return {
    brief,
    message: picks.length ? parts.join(" ") : "Nothing in this edition fits that brief yet — try a higher budget or a different moment, or message us on WhatsApp and we'll help personally.",
    picks: picks.map((p) => ({
      handle: p.handle, name: p.name, price: p.price, image: p.images[1]?.src ?? p.images[0].src, tryOn: !!p.tryOn?.supported, needsSize: p.variants.length > 0,
      reason: brief.occasion && p.occasions.includes(brief.occasion) ? p.story.moment.body : p.description,
    })),
    followUps: [
      !brief.budget ? "Keep it under ₹3,000" : "Show me something more statement",
      brief.metal !== "silver" ? "I prefer silver" : "I prefer gold",
      brief.category !== "earrings" ? "Just earrings" : "Add a kada",
    ],
  };
}
