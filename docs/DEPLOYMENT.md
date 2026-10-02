# Deployment

## Live project
| | |
|---|---|
| Production URL | https://nemara.vercel.app |
| Vercel project | `nemara` (team **JPB**, `prj_ZV9bX5EReZrLCFPAFlNjBwx8zRUa`) |
| Repository | `nishantdwivedi451-rgb/Nemara` |
| Production branch | `claude/nemara-brand-ecommerce-7f1ey4` (the repo's current default). Once you merge it into `main`, change it in Vercel → Settings → Git. |
| Functions region | `bom1` (Mumbai), closest to Indian customers |
| Deployment protection | Vercel Authentication on **preview** deployments only; production is public |

## Pipeline
```
git push → GitHub (nishantdwivedi451-rgb/Nemara) → Vercel build (next build) → deployment
           production branch → Production URL   ·   other branches/PRs → Preview URLs
```
The Vercel project is linked to the GitHub repository, so every push deploys automatically. There is no manual build step.

- Framework preset: **Next.js** · Build: `npm run build` (runs `prebuild` → copies MediaPipe WASM) · Output: `.next` · Node 22.x
- The production branch is the repository's default branch.

## Environment variables
Set them in Vercel → Project → Settings → Environment Variables. See `.env.example` for the full list. Mark secrets (`RAZORPAY_KEY_SECRET`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `RESEND_API_KEY`) as **Sensitive**. Redeploy after changing variables.

## Custom domain (nemara.in / nemara.com)
1. Vercel → Project → Settings → Domains → add `nemara.in` and `www.nemara.in` (redirect one to the other).
2. At your registrar, add the DNS records Vercel shows (A `76.76.21.21` for apex, CNAME `cname.vercel-dns.com` for `www`), or move nameservers to Vercel.
3. Set `NEXT_PUBLIC_SITE_URL=https://nemara.in` and redeploy, so canonical URLs, sitemap and OG use the domain.

Nothing in the code hard-codes a Vercel URL.

## Going live checklist
- [ ] Real photography in `content/*.json` (product, worn, detail, sketch, artists, founder, campaigns)
- [ ] Real artist profiles and contact details (`content/artists.json`, `content/site.json` or `NEXT_PUBLIC_CONTACT_*`)
- [ ] Razorpay KYC complete → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (live keys) → test a ₹1 order
- [ ] `ORDER_WEBHOOK_URL` and/or Resend email so orders reach you
- [ ] Privacy, terms, returns reviewed by a professional (`content/info.json`)
- [ ] `NEXT_PUBLIC_PREVIEW_MODE=false`
- [ ] Custom domain + `NEXT_PUBLIC_SITE_URL`
- [ ] GA4 / Meta Pixel IDs (and a cookie-consent banner if you run ad pixels)
- [ ] Vercel **Pro** plan: Vercel's Hobby plan is for non-commercial use only
- [ ] Submit `https://<domain>/sitemap.xml` in Google Search Console
