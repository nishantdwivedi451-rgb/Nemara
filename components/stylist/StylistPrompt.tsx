"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = ["A black saree for a wedding", "Something subtle for the office", "Cocktail party on Friday", "A gift under ₹3,000"];

export function StylistPrompt({ dark = false }: { dark?: boolean }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const go = (text: string) => router.push(`/stylist?q=${encodeURIComponent(text)}`);
  return (
    <div className={`sprompt ${dark ? "sprompt--dark" : ""}`}>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q.trim()); }} className="sprompt__form">
        <label htmlFor="sp-q" className="sr-only">Tell the Nemara Stylist where you are going</label>
        <input id="sp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Where are you going, and what are you wearing?" className="sprompt__input" maxLength={240} />
        <button className="btn btn--light">Ask</button>
      </form>
      <div className="chips">{EXAMPLES.map((e) => <button key={e} type="button" className="chip" onClick={() => go(e)}>{e}</button>)}</div>
    </div>
  );
}
