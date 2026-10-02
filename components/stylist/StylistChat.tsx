"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/layout/StoreProvider";
import { IconCamera } from "@/components/brand/Icons";
import { formatPrice } from "@/lib/format";
import { track } from "@/lib/analytics";

type Pick = { handle: string; name: string; price: number; image: string; reason: string; tryOn: boolean; needsSize: boolean };
type Msg = { role: "you" | "stylist"; text: string; picks?: Pick[]; followUps?: string[] };
const STARTERS = ["I have a black saree for a wedding", "Something subtle for the office", "I'm going to a cocktail party", "Show me something under ₹3,000"];

export function StylistChat() {
  const sp = useSearchParams();
  const { add } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "stylist", text: "Hello — I'm the Nemara Stylist. Tell me about the moment: where you're going, what you're wearing, and roughly what you'd like to spend." }]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const context = useRef<string[]>([]);
  const end = useRef<HTMLDivElement>(null);
  const asked = useRef(false);

  async function ask(text: string) {
    if (!text.trim() || busy) return;
    setMsgs((m) => [...m, { role: "you", text }]);
    setQ(""); setBusy(true);
    context.current = [...context.current, text].slice(-4); // follow-ups refine the earlier brief
    track("stylist_query", { query: text });
    try {
      const r = await fetch("/api/stylist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: context.current.join(". ") }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMsgs((m) => [...m, { role: "stylist", text: d.message, picks: d.picks, followUps: d.followUps }]);
    } catch {
      setMsgs((m) => [...m, { role: "stylist", text: "I lost my train of thought — please try again in a moment." }]);
    } finally { setBusy(false); }
  }

  useEffect(() => { const first = sp.get("q"); if (first && !asked.current) { asked.current = true; ask(first); } }, [sp]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (msgs.length > 1) end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);

  return (
    <div className="chat">
      <ol className="chat__log" aria-live="polite">
        {msgs.map((m, i) => (
          <li key={i} className={`chat__msg chat__msg--${m.role}`}>
            <span className="eyebrow">{m.role === "you" ? "You" : "Nemara Stylist"}</span>
            <p>{m.text}</p>
            {m.picks && m.picks.length > 0 && (
              <ul className="chat__picks">
                {m.picks.map((p) => (
                  <li key={p.handle} className="chat__pick">
                    <Link href={`/product/${p.handle}`} className="frame ratio-45"><Image src={p.image} alt={p.name} fill sizes="200px" unoptimized /></Link>
                    <div>
                      <Link href={`/product/${p.handle}`} className="chat__pick-name">{p.name}</Link>
                      <span className="muted">{formatPrice(p.price)}</span>
                      <p className="chat__reason">{p.reason}</p>
                      <div className="chat__pick-ctas">
                        {p.tryOn && <Link href={`/try-on?piece=${p.handle}`} className="chip"><IconCamera width={14} height={14} /> Try on</Link>}
                        {p.needsSize ? <Link href={`/product/${p.handle}`} className="chip">Choose size</Link> : <button className="chip" onClick={() => add({ handle: p.handle, name: p.name, price: p.price, image: p.image })}>Add to bag</button>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {m.followUps && i === msgs.length - 1 && <div className="chips">{m.followUps.map((f) => <button key={f} className="chip" onClick={() => ask(f)}>{f}</button>)}</div>}
          </li>
        ))}
        {busy && <li className="chat__msg chat__msg--stylist"><span className="eyebrow">Nemara Stylist</span><p className="chat__typing"><span /><span /><span /></p></li>}
      </ol>
      <div ref={end} />
      {msgs.length === 1 && <div className="chips chat__starters">{STARTERS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div>}
      <form className="chat__form" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <label htmlFor="chat-q" className="sr-only">Message the Nemara Stylist</label>
        <input id="chat-q" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. A green lehenga for my cousin's sangeet, under ₹5,000" maxLength={240} />
        <button className="btn" disabled={busy || !q.trim()}>Send</button>
      </form>
      <p className="muted chat__note">Preview: the Stylist uses Nemara&apos;s styling rules today; a conversational AI stylist can plug into the same experience later.</p>
    </div>
  );
}
