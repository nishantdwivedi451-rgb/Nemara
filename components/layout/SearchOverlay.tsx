"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "./StoreProvider";
import { IconClose, IconSearch } from "@/components/brand/Icons";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";

type Hit = { handle: string; name: string; subtitle?: string; price: number; image: string };
const SUGGEST = ["jhumka", "kada", "filigree", "office", "festive", "under 3000", "gift", "pearl"];

export function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useStore();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { setSearchOpen(false); }, [pathname, setSearchOpen]);
  useEffect(() => {
    if (!searchOpen) return;
    const t = window.setTimeout(() => input.current?.focus(), 60);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", esc);
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", esc); };
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const d = await r.json();
        setHits(d.results ?? []);
        track("search", { search_term: q, results: d.results?.length ?? 0 });
      } catch { /* aborted */ } finally { setLoading(false); }
    }, 220);
    return () => { window.clearTimeout(t); ctrl.abort(); };
  }, [q]);

  if (!searchOpen) return null;
  return (
    <div className="search" role="dialog" aria-modal="true" aria-label="Search Nemara">
      <div className="wrap search__inner">
        <form className="search__bar" role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/shop?q=${encodeURIComponent(q.trim())}`); }}>
          <IconSearch />
          <label htmlFor="search-q" className="sr-only">Search pieces, crafts, moments</label>
          <input id="search-q" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a piece, a craft, a moment…" autoComplete="off" enterKeyHint="search" />
          <button type="button" className="icon-btn" onClick={() => setSearchOpen(false)} aria-label="Close search"><IconClose /></button>
        </form>
        {!q && (
          <div className="search__suggest">
            <p className="eyebrow">Try</p>
            <div className="chips">{SUGGEST.map((s) => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
          </div>
        )}
        {q && (
          <div className="search__results" aria-live="polite">
            {loading && hits.length === 0 && <p className="muted">Looking…</p>}
            {!loading && hits.length === 0 && <p className="muted">Nothing by that name yet. Try “earrings”, “silver” or “celebration” — or ask the <Link className="text-link" href="/stylist">Nemara Stylist</Link>.</p>}
            <ul className="search__grid">
              {hits.map((h) => (
                <li key={h.handle}>
                  <Link href={`/product/${h.handle}`} className="search__hit">
                    <div className="frame ratio-45"><Image src={h.image} alt="" fill sizes="160px" unoptimized /></div>
                    <span className="search__name">{h.name}</span>
                    <span className="muted">{formatPrice(h.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {hits.length > 0 && <Link className="link-arrow" href={`/shop?q=${encodeURIComponent(q)}`}>See all results</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
