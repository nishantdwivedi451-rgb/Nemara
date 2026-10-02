"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { contact } from "@/lib/site";

type Last = { reference: string; items: { name: string; handle: string; image: string }[]; total: number; demo?: boolean };

/** BELONG — post-purchase storytelling instead of a bare receipt. */
export function OrderSuccess() {
  const [o, setO] = useState<Last | null>(null);
  useEffect(() => { try { const r = sessionStorage.getItem("nemara:last-order"); if (r) setO(JSON.parse(r)); } catch { /* ignore */ } }, []);
  return (
    <div className="wrap success">
      <p className="hand">it&apos;s yours now —</p>
      <h1 className="display">Thank you.</h1>
      <p className="lede">Your order {o?.reference ? <strong>{o.reference}</strong> : null} is confirmed. We&apos;ll send tracking by email and WhatsApp as soon as it leaves the studio.{o?.demo ? " (Demo order — no payment was taken.)" : ""}</p>
      {o?.items?.length ? (
        <ul className="success__items">{o.items.map((it) => (
          <li key={it.handle}><Link href={`/product/${it.handle}#story`}><span className="frame ratio-45"><Image src={it.image} alt="" fill sizes="160px" unoptimized /></span><span>{it.name}</span><span className="link-arrow">Read its story</span></Link></li>
        ))}</ul>
      ) : null}
      <div className="success__next">
        <div><p className="eyebrow">01 · Unbox</p><p>Every piece arrives with a story card signed by the artist who made it.</p></div>
        <div><p className="eyebrow">02 · Wear</p><p><Link className="text-link" href="/info/care">Care for it</Link> and it will keep its glow for years.</p></div>
        <div><p className="eyebrow">03 · Belong</p><p>Share your moment with <a className="text-link" href={`https://instagram.com/${contact.instagram}`} target="_blank" rel="noopener noreferrer">@{contact.instagram}</a> and #WearYourStory — we feature our favourites, with the artist.</p></div>
      </div>
      <Link href="/journal" className="btn btn--ghost">Read the Journal</Link>
    </div>
  );
}
