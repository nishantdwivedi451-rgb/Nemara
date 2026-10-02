# Architecture

Next.js 16 (App Router, React 19, TypeScript), deployed on Vercel. Static-first: every catalogue, artist, journal and info page is pre-rendered. Only checkout, try-on and the API routes run on demand.

```
app/                 routes (pages, API, sitemap, robots, OG image, icons)
  api/               search · checkout · payments/verify · contact · newsletter · stylist
components/
  brand/             Logo (wordmark + mark), Icons
  layout/            StoreProvider (cart/wishlist/UI state), Header + mega menu, Footer,
                     CartDrawer, SearchOverlay, MobileTabBar, WhatsAppButton, Toast
  home/              Hero, NemaraWorld, Moments, StoryTeaser, CategoryIndex
  product/           ProductCard, EditorialGrid, ProductRail, ProductGallery, BuyBox, ProductStory
  shop/ cart/ tryon/ stylist/ forms/ editorial/ analytics/
content/             catalogue + editorial data (JSON) — no code
lib/
  commerce/          types · query (filter/sort/search) · providers/{local,shopify}
  payments/          PaymentProvider interface · razorpay · demo
  tryon/             TryOnProvider interface · mediapipe prototype · piece mapper
  stylist/           Stylist engine (rules today, AI-ready)
  analytics/         track() fan-out to dataLayer / GA4 / Meta Pixel / custom adapters
  orders.ts          zod schemas + server-side cart pricing
  seo.ts site.ts content.ts notify.ts rate-limit.ts format.ts
styles/              tokens.css · base.css · components.css · pages.css
scripts/             generate-art.mjs (placeholder art) · copy-mediapipe.mjs (self-hosted WASM)
```

## Design system
- **Tokens** (`styles/tokens.css`): colour (ink purple, ivory and champagne), type scale, spacing, motion easing.
- **Primitives** (`styles/base.css`): `.display/.h1–h3`, `.eyebrow`, `.edition`, `.hand` (Pratima's margin voice), `.btn` variants, `.chip`, form controls, `.arch` mask, `.reveal` and `.lines` motion utilities.
- **Components** live in `components/`. Pages compose them and are never styled ad hoc.
- Motion is CSS-first (IntersectionObserver adds `.is-in`) and respects `prefers-reduced-motion`.

## Providers (swap without touching UI)

| Concern | Interface | Implementations | Switch |
|---|---|---|---|
| Catalogue | `CommerceProvider` (`lib/commerce/types.ts`) | `local` (JSON), `shopify` (Storefront API) | `COMMERCE_PROVIDER` |
| Checkout | `createHostedCheckout?` on the commerce provider | Shopify cart → hosted checkout | automatic when provider supports it |
| Payments | `PaymentProvider` (`lib/payments/types.ts`) | `razorpay`, `demo` | presence of `RAZORPAY_KEY_ID/SECRET` |
| Try-on | `TryOnProvider` (`lib/tryon/types.ts`): `createTracker` (Nemara renders) or `mount` (vendor renders) | `mediapipe` (on-device face + hand landmarks) | `NEXT_PUBLIC_TRY_ON_PROVIDER` |
| Stylist | `style(raw) → StylistReply` (`lib/stylist`) | rules engine | add an AI engine returning the same shape |
| Analytics | `track(event, props)` + `registerAnalyticsAdapter` | dataLayer, GA4, Meta Pixel, Vercel Analytics | `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID` |
| Editorial | `lib/content.ts` | JSON | replace functions with a headless CMS |

### Adding a production AR vendor
1. Create `lib/tryon/<vendor>.ts` implementing `TryOnProvider.mount(el, product)` (or `createTracker`).
2. Register it in `lib/tryon/index.ts` and set `NEXT_PUBLIC_TRY_ON_PROVIDER=<vendor>`.
3. Put vendor model ids in each product's `tryOn.arAsset = { provider, ref }`.
The studio UI, product pages, analytics (`try_on_started`/`try_on_completed`) and snapshot/share flow stay unchanged.

### Adding the AI stylist
Implement an engine with the signature `(raw: string) => Promise<StylistReply>`: send the parsed brief plus a compact catalogue (handle, name, price, occasions, tags, story.moment) to an LLM, validate the returned handles against the catalogue, and return the same JSON. `app/api/stylist/route.ts` and the chat UI don't change.

## Checkout & payment flow
```
Bag (localStorage) → /checkout (guest form, PIN autofill)
  → POST /api/checkout   zod-validate → reprice from catalogue → create gateway order (or Shopify hosted checkout URL)
  → Razorpay Checkout     UPI · cards · net banking · wallets (card/UPI data never touches Nemara)
  → POST /api/payments/verify   HMAC-SHA256 signature check → reprice → notify(order) → reference
  → /checkout/success     post-purchase storytelling ("Belong")
```
- Prices are **always** recomputed server-side, so a tampered client total is ignored.
- Secrets exist only in server modules (`import "server-only"`).
- Orders are recorded in the Razorpay dashboard and pushed to `ORDER_WEBHOOK_URL` and/or emailed via Resend. For a full order database, add Vercel Postgres/Neon or use Shopify as the system of record.
- **Recommended before launch:** add a Razorpay webhook (`payment.captured`) as a server-to-server backup to the client callback.

## Security
CSP and security headers in `next.config.ts` (frame-ancestors none, HSTS, nosniff, camera limited to self). All inputs are validated with zod. Forms use honeypots and per-IP rate limiting (in-memory; move it to Upstash/Vercel KV for strict guarantees). JSON-LD is escaped. Analytics scripts load only when configured.

## Performance
Static generation, `next/font` (self-hosted, swap), SVG placeholder art (small, cached for 1 day), lazy images with `sizes`, no animation library, MediaPipe loaded only when the camera starts, and WASM self-hosted and cached immutably.
