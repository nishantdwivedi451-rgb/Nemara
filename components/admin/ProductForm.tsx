"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveProduct, uploadImage, type ProductInput } from "@/app/admin/actions";
import type { StoredProduct } from "@/lib/catalogue";

type Taxon = { slug: string; name: string };
type Props = { initial?: StoredProduct; taxonomy: { categories: Taxon[]; occasions: Taxon[]; collections: Taxon[] }; artists: { slug: string; name: string }[] };

const SLOTS = [
  { role: "hero", label: "Main image", help: "The piece on a clean background" },
  { role: "worn", label: "As worn", help: "On the body — also the hover image" },
  { role: "detail", label: "Close-up", help: "Texture, stones, finish" },
  { role: "story", label: "Sketch / story", help: "Pratima's sketch or making-of" },
];
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);

/** Downscale and convert to WebP in the browser so uploads are small and fast (alpha preserved). */
async function compress(file: File, max = 1800): Promise<File> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), "image/webp", 0.86));
  return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
}

export function ProductForm({ initial, taxonomy, artists }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [handleTouched, setHandleTouched] = useState(!!initial);
  const [f, setF] = useState(() => ({
    name: initial?.name ?? "", handle: initial?.handle ?? "", sku: initial?.sku ?? "", subtitle: initial?.subtitle ?? "",
    description: initial?.description ?? "", price: initial?.price ?? 0, compareAtPrice: initial?.compareAtPrice ?? 0,
    inventory: initial?.inventory ?? 0, lowStockAt: initial?.lowStockAt ?? 5,
    category: initial?.category ?? taxonomy.categories[0]?.slug ?? "", occasions: initial?.occasions ?? [], collections: initial?.collections ?? [],
    tags: (initial?.tags ?? []).join(", "), material: initial?.material ?? "", dimensions: initial?.dimensions ?? "", care: initial?.care ?? "",
    artist: initial?.artist ?? "", featured: initial?.featured ?? false, exclusive: initial?.exclusive ?? false, status: initial?.status ?? "active",
    images: SLOTS.map((s) => initial?.images.find((i) => i.role === s.role)?.src ?? ""),
    ideaBody: initial?.story.idea.body ?? "", ideaNote: initial?.story.idea.note ?? "",
    handContribution: initial?.story.hand.contribution ?? "", handQuote: (initial?.story.hand as { quote?: string } | undefined)?.quote ?? "",
    makingBody: initial?.story.making.body ?? "", makingSteps: (initial?.story.making.steps ?? []).join("\n"), momentBody: initial?.story.moment.body ?? "",
    sizes: (initial?.variants ?? []).map((v) => v.title).join(", "),
    tryOn: initial?.tryOn?.supported ?? false, anchor: (initial?.tryOn?.anchor as "ears" | "neck" | "wrist") ?? "ears",
    overlay: initial?.tryOn?.overlay ?? "", scale: initial?.tryOn?.scale ?? 1,
  }));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const toggle = (k: "occasions" | "collections", v: string) => set(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);
  const err = (k: string) => errors[k] && <span className="a-error">{errors[k]}</span>;

  async function upload(file: File, done: (url: string) => void, key: string) {
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", await compress(file));
      fd.append("folder", f.handle || slug(f.name) || "uploads");
      const r = await uploadImage(fd);
      if (r.url) done(r.url); else setMsg({ ok: false, text: r.error ?? "Upload failed" });
    } catch { setMsg({ ok: false, text: "Upload failed — check your connection." }); }
    finally { setUploading(null); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErrors({});
    const sizes = f.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    const input: ProductInput = {
      previousHandle: initial?.handle, handle: f.handle, sku: f.sku.trim().toUpperCase(), name: f.name.trim(), subtitle: f.subtitle.trim(),
      description: f.description.trim(), price: Math.round(Number(f.price)), compareAtPrice: Number(f.compareAtPrice) > 0 ? Math.round(Number(f.compareAtPrice)) : null,
      inventory: Math.round(Number(f.inventory)), lowStockAt: Math.round(Number(f.lowStockAt)),
      category: f.category, occasions: f.occasions, collections: f.collections, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
      material: f.material, dimensions: f.dimensions, care: f.care, artist: f.artist, featured: f.featured, exclusive: f.exclusive, status: f.status as "active" | "draft",
      images: SLOTS.map((s, i) => ({ src: f.images[i], alt: `${f.name} — ${s.label.toLowerCase()}`, role: s.role })).filter((i) => i.src),
      story: {
        idea: { body: f.ideaBody, note: f.ideaNote || undefined }, hand: { contribution: f.handContribution, quote: f.handQuote || undefined },
        making: { body: f.makingBody, steps: f.makingSteps.split("\n").map((s) => s.trim()).filter(Boolean) }, moment: { body: f.momentBody },
      },
      variants: sizes.map((t) => ({ title: t, sku: `${f.sku.trim().toUpperCase()}-${t.replace(/\W/g, "")}` })),
      tryOn: f.tryOn && f.overlay ? { supported: true, anchor: f.anchor, overlay: f.overlay, scale: Number(f.scale) || 1 } : null,
    };
    start(async () => {
      const r = await saveProduct(input);
      if (r.ok) {
        setMsg({ ok: true, text: f.status === "draft" ? "Saved as draft." : "Saved — live on the storefront." });
        if (!initial || initial.handle !== r.handle) router.replace(`/admin/products/${r.handle}`);
        else router.refresh();
      } else { setErrors(r.fields ?? {}); setMsg({ ok: false, text: r.error ?? "Could not save" }); }
    });
  }

  return (
    <form className="a-pform" onSubmit={submit} noValidate>
      <div className="a-pform__main">
        <section className="a-card">
          <div className="a-card__head"><h2>The piece</h2></div>
          <div className="a-form">
            <label className="a-field"><span>Name</span><input className="a-input" value={f.name} onChange={(e) => { set("name", e.target.value); if (!handleTouched) set("handle", slug(e.target.value)); }} required />{err("name")}</label>
            <div className="a-row2">
              <label className="a-field"><span>URL handle</span><input className="a-input a-mono" value={f.handle} onChange={(e) => { setHandleTouched(true); set("handle", slug(e.target.value)); }} />{err("handle")}<small>nemara…/product/{f.handle || "…"}</small></label>
              <label className="a-field"><span>SKU</span><input className="a-input a-mono" value={f.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} placeholder="NEM-ER-XXX-13" />{err("sku")}</label>
            </div>
            <label className="a-field"><span>Subtitle</span><input className="a-input" value={f.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. Lilac enamel jhumkas" /></label>
            <label className="a-field"><span>Description</span><textarea className="a-input" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} />{err("description")}</label>
          </div>
        </section>

        <section className="a-card">
          <div className="a-card__head"><h2>Images</h2><small className="a-muted">Upload any JPG/PNG — it&apos;s resized and converted to WebP automatically</small></div>
          <div className="a-slots">
            {SLOTS.map((s, i) => (
              <div key={s.role} className="a-slot">
                <div className="a-slot__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {f.images[i] ? <img src={f.images[i]} alt="" /> : <span>{uploading === s.role ? "Uploading…" : "No image"}</span>}
                </div>
                <b>{s.label}</b><small>{s.help}</small>
                <div className="a-slot__actions">
                  <label className="a-btn a-btn--sm">{f.images[i] ? "Replace" : "Upload"}<input type="file" accept="image/*" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file, (url) => setF((st) => ({ ...st, images: st.images.map((x, j) => (j === i ? url : x)) })), s.role); e.target.value = ""; }} /></label>
                  {f.images[i] && <button type="button" className="a-link" onClick={() => setF((st) => ({ ...st, images: st.images.map((x, j) => (j === i ? "" : x)) }))}>Remove</button>}
                </div>
              </div>
            ))}
          </div>
          {err("images")}
        </section>

        <section className="a-card">
          <div className="a-card__head"><h2>The story</h2><small className="a-muted">Idea → Hand → Making → Moment, shown on the product page</small></div>
          <div className="a-form">
            <label className="a-field"><span>The idea — what inspired Pratima?</span><textarea className="a-input" rows={3} value={f.ideaBody} onChange={(e) => set("ideaBody", e.target.value)} /></label>
            <label className="a-field"><span>Margin note (handwritten line)</span><input className="a-input" value={f.ideaNote} onChange={(e) => set("ideaNote", e.target.value)} placeholder="not ruby. lilac." /></label>
            <div className="a-row2">
              <label className="a-field"><span>Artist</span><select className="a-input" value={f.artist} onChange={(e) => set("artist", e.target.value)}><option value="">—</option>{artists.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}</select></label>
              <label className="a-field"><span>Artist quote (optional)</span><input className="a-input" value={f.handQuote} onChange={(e) => set("handQuote", e.target.value)} /></label>
            </div>
            <label className="a-field"><span>The hand — what the artist contributed</span><textarea className="a-input" rows={2} value={f.handContribution} onChange={(e) => set("handContribution", e.target.value)} /></label>
            <label className="a-field"><span>The making</span><textarea className="a-input" rows={2} value={f.makingBody} onChange={(e) => set("makingBody", e.target.value)} /></label>
            <label className="a-field"><span>Making steps (one per line)</span><textarea className="a-input" rows={3} value={f.makingSteps} onChange={(e) => set("makingSteps", e.target.value)} /></label>
            <label className="a-field"><span>The moment — where is she wearing it?</span><textarea className="a-input" rows={2} value={f.momentBody} onChange={(e) => set("momentBody", e.target.value)} /></label>
          </div>
        </section>

        <section className="a-card">
          <div className="a-card__head"><h2>Details</h2></div>
          <div className="a-form">
            <label className="a-field"><span>Material</span><input className="a-input" value={f.material} onChange={(e) => set("material", e.target.value)} /></label>
            <label className="a-field"><span>Dimensions &amp; weight</span><input className="a-input" value={f.dimensions} onChange={(e) => set("dimensions", e.target.value)} /></label>
            <label className="a-field"><span>Care</span><textarea className="a-input" rows={2} value={f.care} onChange={(e) => set("care", e.target.value)} /></label>
            <label className="a-field"><span>Sizes (comma-separated, leave empty if one size)</span><input className="a-input" value={f.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="2.4, 2.6, 2.8" /></label>
            <label className="a-field"><span>Tags (comma-separated, help search)</span><input className="a-input" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="enamel, lilac, festive" /></label>
          </div>
        </section>

        <section className="a-card">
          <div className="a-card__head"><h2>Try It On</h2></div>
          <div className="a-form">
            <label className="a-check"><input type="checkbox" checked={f.tryOn} onChange={(e) => set("tryOn", e.target.checked)} /> Enable virtual try-on for this piece</label>
            {f.tryOn && (
              <div className="a-row3">
                <label className="a-field"><span>Worn at</span><select className="a-input" value={f.anchor} onChange={(e) => set("anchor", e.target.value as "ears")}><option value="ears">Ears</option><option value="neck">Neck</option><option value="wrist">Wrist</option></select></label>
                <label className="a-field"><span>Scale</span><input type="number" step="0.05" min="0.3" max="3" className="a-input" value={f.scale} onChange={(e) => set("scale", Number(e.target.value))} /></label>
                <div className="a-field"><span>Overlay (transparent PNG)</span>
                  <div className="a-overlay">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {f.overlay ? <img src={f.overlay} alt="" /> : <em>{uploading === "overlay" ? "Uploading…" : "None"}</em>}
                    <label className="a-btn a-btn--sm">Upload<input type="file" accept="image/png,image/webp,image/svg+xml" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file, (url) => set("overlay", url), "overlay"); e.target.value = ""; }} /></label>
                  </div>
                </div>
              </div>
            )}
            {f.tryOn && !f.overlay && <p className="a-hint">Upload a transparent cut-out of the piece shot straight-on. Earrings: hook at top-centre. Necklaces: lowest point ~72% down. Bracelets/kadas: ring centred.</p>}
          </div>
        </section>
      </div>

      <aside className="a-pform__side">
        <section className="a-card">
          <div className="a-card__head"><h2>Publishing</h2></div>
          <div className="a-form">
            <div className="a-seg" role="radiogroup" aria-label="Status">
              <button type="button" role="radio" aria-checked={f.status === "active"} className={f.status === "active" ? "is-on" : ""} onClick={() => set("status", "active")}>Live</button>
              <button type="button" role="radio" aria-checked={f.status === "draft"} className={f.status === "draft" ? "is-on" : ""} onClick={() => set("status", "draft")}>Draft</button>
            </div>
            <label className="a-check"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured (shown first)</label>
            <label className="a-check"><input type="checkbox" checked={f.exclusive} onChange={(e) => set("exclusive", e.target.checked)} /> Circle exclusive (shown in the members popup)</label>
          </div>
        </section>
        <section className="a-card">
          <div className="a-card__head"><h2>Price &amp; stock</h2></div>
          <div className="a-form">
            <div className="a-row2">
              <label className="a-field"><span>Price (₹)</span><input type="number" min="1" className="a-input" value={f.price || ""} onChange={(e) => set("price", Number(e.target.value))} />{err("price")}</label>
              <label className="a-field"><span>Compare at (₹)</span><input type="number" min="0" className="a-input" value={f.compareAtPrice || ""} onChange={(e) => set("compareAtPrice", Number(e.target.value))} /></label>
            </div>
            <div className="a-row2">
              <label className="a-field"><span>In stock</span><input type="number" min="0" className="a-input" value={f.inventory} onChange={(e) => set("inventory", Number(e.target.value))} />{err("inventory")}</label>
              <label className="a-field"><span>Low-stock alert at</span><input type="number" min="0" className="a-input" value={f.lowStockAt} onChange={(e) => set("lowStockAt", Number(e.target.value))} /></label>
            </div>
          </div>
        </section>
        <section className="a-card">
          <div className="a-card__head"><h2>Organisation</h2></div>
          <div className="a-form">
            <label className="a-field"><span>Category</span><select className="a-input" value={f.category} onChange={(e) => set("category", e.target.value)}>{taxonomy.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label>
            <fieldset className="a-field"><span>Moments</span><div className="a-chips">{taxonomy.occasions.map((o) => <button type="button" key={o.slug} className={f.occasions.includes(o.slug) ? "is-on" : ""} onClick={() => toggle("occasions", o.slug)}>{o.name}</button>)}</div></fieldset>
            <fieldset className="a-field"><span>Collections</span><div className="a-chips">{taxonomy.collections.map((o) => <button type="button" key={o.slug} className={f.collections.includes(o.slug) ? "is-on" : ""} onClick={() => toggle("collections", o.slug)}>{o.name}</button>)}</div></fieldset>
          </div>
        </section>
        <div className="a-savebar">
          {msg && <p className={msg.ok ? "a-ok" : "a-error"} role="status">{msg.text}</p>}
          <button className="a-btn a-btn--primary a-btn--block" disabled={pending || !!uploading}>{pending ? "Saving…" : initial ? "Save changes" : "Create design"}</button>
        </div>
      </aside>
    </form>
  );
}
