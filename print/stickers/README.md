# NEMARA — sticker & tag system (v1)

Hand the printer the five numbered PDFs plus `Nemara-Stickers-Presentation.pdf` (page 7 is the print spec).
Every A4 sheet comes as three pages in identical position: **Artwork** (CMYK, foil shown gold) → **Foil plate** (100% K) → **Die-cut** (magenta hairline).

| File | Sticker | Size | Designs | Up / A4 | Goes on |
|---|---|---|---|---|---|
| 01-the-seal.pdf | The Seal | Ø20 mm | 1 | 88 | pouches, boxes, envelopes |
| 02-the-story-tag.pdf | The Story Tag (QR) | 32 × 20 mm | 12 (per product) | 55 | box back / care card |
| 03-the-jewel-flag.pdf | The Jewel Flag (wrap tag) | 56 × 10 mm | 12 (per product) | 54 | the jewellery itself — sticks to itself, not the metal |
| 04-the-arch.pdf | The Arch | 24 × 32 mm | 1 | 42 | gift boxes, hampers |
| 05-the-margin-note.pdf | The Margin Note | 60 × 12 mm | 4 (per artisan) | 48 | box seam / pouch flap |

**Key specs:** 1.5 mm bleed, text ≥1 mm inside cut, print at 100%. Nemara Ink #4B1D5C ≈ C72 M100 Y24 K32 (Pantone ~2627 C) — get a hard proof.
Foil = matte champagne gold. Jewel Flag must be on synthetic PP/vinyl (paper tails tear). Scan-test one Story Tag QR per sheet.

QR codes point to `https://nemara.vercel.app/p/<handle>` → redirects to the product page with `utm_source=tag`, so scans appear in Studio › Visitors.
Prices on the Jewel Flag come from `content/products.json` — regenerate if prices change:

```bash
node scripts/stickers/generate.mjs
```

`fonts/` holds the OFL font files in case prepress needs to edit.
