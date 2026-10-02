# Catalogue & content

All catalogue and editorial data lives in `content/`, separate from presentation. Edit the JSON, commit, and Vercel redeploys automatically. (With Shopify enabled, products come from Shopify admin instead.)

| File | What it holds |
|---|---|
| `content/products.json` | Products (SKU, price, inventory, images, story, try-on, variants…) |
| `content/artists.json` | Artist profiles |
| `content/taxonomy.json` | Categories, occasions ("moments"), collections — add new categories here, no code change |
| `content/journal.json` | Journal entries (founder notes, behind the design, styling guides…) |
| `content/site.json` | Contact details, shipping rules, hero media, founder imagery |
| `content/info.json` | Shipping, returns, care, size guide, privacy, terms |

## Product fields
```jsonc
{
  "id": "nem_002", "sku": "NEM-ER-MON-02", "handle": "monsoon-hour-jhumka",   // handle = URL
  "name": "Monsoon Hour Jhumka", "subtitle": "Lilac enamel jhumkas",
  "description": "…", "price": 3490, "compareAtPrice": null, "currency": "INR",
  "inventory": 12,                         // ≤8 shows "Only a few made", 0 = sold out
  "category": "earrings",                  // slug from taxonomy.categories
  "occasions": ["celebration", "after-hours"],
  "collections": ["new-arrivals", "editors-picks"],
  "tags": ["enamel", "jhumka"],
  "material": "…", "dimensions": "…", "care": "…",
  "artist": "meher-bano",                  // slug from artists.json → links product ↔ artist
  "featured": true,
  "images": [                              // order matters: hero, worn, detail, story
    { "src": "/media/monsoon/hero.jpg", "alt": "…", "role": "hero" },
    { "src": "/media/monsoon/worn.jpg", "alt": "…", "role": "worn" },
    { "src": "/media/monsoon/detail.jpg", "alt": "…", "role": "detail" },
    { "src": "/media/monsoon/sketch.jpg", "alt": "…", "role": "story" }
  ],
  "story": {
    "idea":   { "body": "What inspired Pratima…", "note": "handwritten margin note" },
    "hand":   { "contribution": "What the artist did…", "quote": "optional" },
    "making": { "body": "…", "steps": ["…"], "image": {"src":"…","alt":"…"}, "video": "optional" },
    "moment": { "body": "The mood / occasion…" }
  },
  "variants": [{ "title": "2.6", "sku": "NEM-KD-SUN-26" }],   // optional (e.g. kada sizes)
  "tryOn": { "supported": true, "anchor": "ears|neck|wrist", "overlay": "/media/monsoon/overlay.png", "scale": 1.15, "arAsset": null },
  "seo": { "title": null, "description": null }
}
```

### Images
- Use 4:5 portrait images, ideally ≥1600px tall. JPG/WebP for photos.
- The **worn** image is also the card's hover image, so always show the piece on the body.
- **Try-on overlays** are transparent PNGs of the piece shot straight-on. Earrings: hook at top-centre (about 10% from the top). Necklaces: the lowest point of the curve about 72% down. Bracelets and kadas: the ring centred.
- Remote images (Shopify CDN) work out of the box. Add other hosts to `images.remotePatterns` in `next.config.ts`.

### Hero campaign
Set `content/site.json → hero.media` to `{ "type": "video", "src": "/media/hero.mp4", "poster": "/media/hero.jpg" }` or `{ "type": "image", "src": "…", "alt": "…" }`.

## Shopify mapping (COMMERCE_PROVIDER=shopify)
| Nemara field | Shopify source |
|---|---|
| name, description, handle, tags, images, variants, price | native product fields |
| inventory | `totalInventory` (enable *unauthenticated_read_product_inventory*) |
| collections | product collections (use the same handles as `taxonomy.json`) |
| subtitle, category, material, dimensions, care, artist | metafields `nemara.<key>` (single-line text) |
| occasions | metafield `nemara.occasions` (JSON list) or tags `occasion:<slug>` |
| story | metafield `nemara.story` (JSON, same shape as above) |
| try_on | metafield `nemara.try_on` (JSON, same shape as `tryOn`) |
| featured | metafield `nemara.featured` (boolean) |

Expose these metafields to the Storefront API (Settings → Custom data → Products → each definition → *Storefront access*).
