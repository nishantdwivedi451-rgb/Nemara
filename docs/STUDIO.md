# Nemara Studio — OMS, inventory & marketing automation

Studio lives at **`/admin`** (and on the dedicated admin hostname set by `ADMIN_HOST`). Only `ADMIN_EMAIL` can sign in; every page, server action and `/api/admin/*` endpoint checks a signed, HTTP-only session cookie (7 days). The password is stored only as a salted scrypt hash in `ADMIN_PASSWORD_HASH`. Login is rate-limited (5 attempts / 15 min / IP), and Studio is `noindex` and excluded in robots.txt.

## Modules
| Section | What it does |
|---|---|
| **Overview** | 30-day revenue, AOV, orders to ship, Circle growth, engaged visitors, join rate, 14-day revenue chart, low stock, birthdays, festivals |
| **Orders** | Every paid storefront order (created automatically on verified payment). Filter by status, search, update status (paid → processing → packed → shipped → delivered / cancelled / refunded), courier + tracking, internal notes, timeline, one-tap WhatsApp to the customer, CSV export. Cancelling/refunding an unshipped order returns stock. |
| **Products** | Add/edit/delete designs: name, URL, SKU, price, stock, category, moments, collections, tags, material, dimensions, care, sizes, 4 image slots (auto-compressed to WebP), the full Idea → Hand → Making → Moment story, artist, try-on overlay, featured, **Circle exclusive**, Live/Draft. Saving refreshes the live storefront immediately. |
| **Inventory** | Stock per design, low-stock and sold-out filters, add/remove or set counts with a reason, movement log (sales, restocks, edits). Sales decrement stock automatically. |
| **Customers** | Circle members and buyers merged by phone: orders, spend, birthday, member code; segments (members, buyers, members yet to buy); WhatsApp; CSV export. |
| **Visitors** | Engaged sessions (≥15s): landing page, pages viewed, source/UTM, device, browser, city/country, returning, whether they joined the Circle. |
| **Marketing** | Birthday hampers (next 30 days), festival gifting (next 60 days, per-festival lists + export), abandoned checkouts with WhatsApp nudges, "mark sent" tracking so nobody is messaged twice; edit the popup (delay, copy, benefits, consent, exclusives), message templates and festival calendar. |

## Nemara Circle (storefront)
After the visitor has spent the configured time on site (default **15s**, visible time only, across pages), the site records one engaged session and shows the Circle invitation: free lifetime membership, members-only designs, birthday hamper, festival gifts. It captures name, mobile, email, birthday and **explicit consent** (India's DPDP Act). It shows once and is snoozed for 7 days if dismissed. It never appears on cart, checkout or try-on. Contact details are only ever captured when the visitor submits the form; there is no silent identification.

## Automation
- **Daily digest** (Vercel Cron, 09:00 IST → `/api/cron/daily`): birthdays in the next 3 days, festivals this week, low stock, orders to ship. Delivered via `LEAD_WEBHOOK_URL` and/or Resend email (`RESEND_API_KEY` + `NOTIFY_EMAIL_TO`).
- Every new member and order is pushed to the configured webhook/email in real time.

## Data
`lib/store` is one document-store interface with three backends, chosen automatically:
1. **Postgres** (`DATABASE_URL`, e.g. Neon from the Vercel Marketplace). Recommended once traffic grows.
2. **Vercel Blob, private** (`BLOB_READ_WRITE_TOKEN`). Works out of the box; no customer record is publicly addressable. Uploaded images are served through `/media/*` with long-lived CDN caching.
3. **Local files** (`.data/`) for development.

Writes are frugal by design: one write per engaged session, one per Circle sign-up, and two per order. Vercel Blob's Hobby allowance is limited, so move to Postgres (free Neon tier) before running paid traffic.

## Changing the password
```bash
node scripts/hash-password.mjs "a-new-strong-passphrase"
```
Paste the output into Vercel → Settings → Environment Variables → `ADMIN_PASSWORD_HASH`, then redeploy. To sign everyone out, also rotate `ADMIN_SESSION_SECRET`.

## Customer accounts (storefront)
- **Sign in / register** from the header, the mobile tab bar, the wishlist, or checkout. Enter a mobile number *or* email, then a 6-digit code. New customers also verify the other contact (mobile + email), so every account has both verified.
- **Checkout** requires a verified account whenever storage is connected. Contact details are locked to the verified ones, saved addresses appear as one-tap choices, and a new address can be saved during checkout.
- **My account** (`/account`): orders with live status, a tracking page per order (placed → being prepared → packed → on its way → delivered, courier and tracking link from Studio), saved addresses (add, edit, default, remove), profile and wishlist.
- **Wishlist**: works signed-out on the device. Signing in merges it into the account and keeps it in sync across devices. The first save invites sign-in, but never blocks it.
- **Security**: codes are 6 digits, HMAC-hashed at rest, expire in 10 minutes, lock after 5 wrong attempts, and have a 30s resend cooldown and per-IP/per-number send limits. Sessions are signed HTTP-only cookies (30 days), domain-separated from Studio sessions. Orders are visible only to the account they belong to.
- **Delivery**: email via Resend (`RESEND_API_KEY`, `OTP_EMAIL_FROM` on a verified domain). SMS via MSG91 (`MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`, DLT-registered template) or Twilio. Until a provider is connected, the preview edition shows the code on screen so the flow can be tested.
- Paid orders attach automatically to the account with the same verified mobile number.
