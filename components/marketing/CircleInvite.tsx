"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconClose } from "@/components/brand/Icons";
import { track } from "@/lib/analytics";

type Popup = { enabled: boolean; delaySeconds: number; eyebrow: string; title: string; body: string; benefits: string[]; cta: string; consentText: string; showExclusives: boolean };
type Exclusive = { handle: string; name: string; image: string };

const EXCLUDE = ["/checkout", "/cart", "/try-on", "/info/privacy"];
const SNOOZE_DAYS = 7;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
const ss = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* private mode */ } },
};
const uuid = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).toLowerCase();

/**
 * Engagement + Nemara Circle invitation.
 *  - Counts *visible* time on site across pages in a session.
 *  - At the configured dwell time (default 15s): records one engaged session, then
 *    invites the visitor to the free lifetime Circle (once; snoozed for 7 days if dismissed).
 *  - Contact details are only ever collected when the visitor chooses to submit them, with consent.
 */
export function CircleInvite({ settings, exclusives, track: trackEngaged = true }: { settings: Popup; exclusives: Exclusive[]; track?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"form" | "busy" | "done">("form");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; name: string; existing: boolean } | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const pathRef = useRef(pathname); pathRef.current = pathname;

  // session bookkeeping: visitor id, pages, UTM
  useEffect(() => {
    let vid = ls.get("nemara:vid");
    if (!vid) { vid = uuid(); ls.set("nemara:vid", vid); ss.set("nemara:new", "1"); }
    if (!ss.get("nemara:start")) {
      ss.set("nemara:start", new Date().toISOString());
      ss.set("nemara:landing", window.location.pathname + window.location.search);
      ss.set("nemara:ref", document.referrer && !document.referrer.includes(window.location.host) ? document.referrer : "");
      const q = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "gclid", "fbclid"].forEach((k) => { const v = q.get(k); if (v) utm[k] = v.slice(0, 120); });
      ss.set("nemara:utm", JSON.stringify(utm));
    }
    const pages: string[] = JSON.parse(ss.get("nemara:pages") ?? "[]");
    if (pages[pages.length - 1] !== pathname) { pages.push(pathname); ss.set("nemara:pages", JSON.stringify(pages.slice(-40))); }
  }, [pathname]);

  // visible dwell timer
  useEffect(() => {
    const delay = Math.max(5, settings.delaySeconds || 15);
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const t = Number(ss.get("nemara:dwell") ?? "0") + 1;
      ss.set("nemara:dwell", String(t));
      if (t < delay) return;
      if (trackEngaged && !ss.get("nemara:engaged")) {
        ss.set("nemara:engaged", "1");
        fetch("/api/track/engaged", {
          method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
          body: JSON.stringify({
            visitorId: ls.get("nemara:vid"), startedAt: ss.get("nemara:start"), landing: ss.get("nemara:landing") ?? "/",
            pages: JSON.parse(ss.get("nemara:pages") ?? "[]"), referrer: ss.get("nemara:ref") || undefined,
            utm: JSON.parse(ss.get("nemara:utm") ?? "{}"), returning: !ss.get("nemara:new"),
          }),
        }).catch(() => {});
      }
      if (!settings.enabled || open) return;
      const mem = JSON.parse(ls.get("nemara:circle") ?? "null") as { s: string; at: number } | null;
      if (mem?.s === "joined" || (mem?.s === "dismissed" && Date.now() - mem.at < SNOOZE_DAYS * 864e5)) return;
      if (EXCLUDE.some((p) => pathRef.current.startsWith(p))) return;
      if (document.querySelector(".cart-drawer.is-open, .search, .tryon-modal, .nav-drawer.is-open, .demo-pay")) return;
      setOpen(true);
      track("page_view", { circle_invite: "shown" });
    }, 1000);
    return () => window.clearInterval(tick);
  }, [settings.enabled, settings.delaySeconds, open, trackEngaged]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => dialog.current?.querySelector<HTMLInputElement>("input")?.focus(), 80);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", esc);
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", esc); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    if (state !== "done") ls.set("nemara:circle", JSON.stringify({ s: "dismissed", at: Date.now() }));
    setOpen(false);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const birthday = fd.bmonth && fd.bday ? `${fd.bmonth}-${fd.bday}` : "";
    setState("busy"); setErrors({}); setError("");
    try {
      const r = await fetch("/api/circle/join", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.name, phone: fd.phone, email: fd.email, birthday, consent: fd.consent === "on", company: fd.company, visitorId: ls.get("nemara:vid"), page: pathRef.current, utm: JSON.parse(ss.get("nemara:utm") ?? "{}") }),
      });
      const d = await r.json();
      if (!r.ok) { setErrors(d.fields ?? {}); throw new Error(d.error || "Please try again."); }
      setResult(d); setState("done");
      ls.set("nemara:circle", JSON.stringify({ s: "joined", at: Date.now() }));
      track("newsletter_signup", { placement: "circle_invite" });
    } catch (err) { setError((err as Error).message); setState("form"); }
  }

  if (!open) return null;
  const inv = (n: string) => (errors[n] ? { "aria-invalid": true, "aria-describedby": `ci-${n}-err` } : {});
  const err = (n: string) => errors[n] && <span id={`ci-${n}-err`} className="field-error">{errors[n]}</span>;

  return (
    <div className="circle" role="dialog" aria-modal="true" aria-labelledby="circle-title" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="circle__card" ref={dialog}>
        <button className="circle__close" onClick={close} aria-label="Close"><IconClose /></button>
        {settings.showExclusives && exclusives.length > 0 && (
          <div className="circle__art" aria-hidden="true">
            <span className="circle__tag">Members-only designs</span>
            <div className="circle__pieces">
              {exclusives.map((x) => <div key={x.handle} className="circle__piece arch"><Image src={x.image} alt="" fill sizes="160px" unoptimized /></div>)}
            </div>
          </div>
        )}
        <div className="circle__body">
          {state === "done" && result ? (
            <div className="circle__done">
              <p className="eyebrow">{settings.eyebrow}</p>
              <h2 id="circle-title" className="h2">{result.existing ? `Welcome back, ${result.name}.` : `Welcome to the Circle, ${result.name}.`}</h2>
              <p className="circle__code">Your member code <strong>{result.code}</strong></p>
              <p className="muted">Your lifetime membership is active. Expect a message from us before your birthday and the big festivals — and first look at every members-only design.</p>
              <Link href="/shop" className="btn" onClick={() => setOpen(false)}>Explore the edition</Link>
            </div>
          ) : (
            <>
              <p className="eyebrow">{settings.eyebrow}</p>
              <h2 id="circle-title" className="h2">{settings.title}</h2>
              <p className="circle__lede">{settings.body}</p>
              <ul className="circle__benefits">{settings.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
              <form className="circle__form" onSubmit={submit} noValidate>
                <div className="field"><label htmlFor="ci-name">Name</label><input id="ci-name" name="name" className="input" autoComplete="name" required {...inv("name")} />{err("name")}</div>
                <div className="circle__row">
                  <div className="field"><label htmlFor="ci-phone">Mobile</label><input id="ci-phone" name="phone" type="tel" inputMode="tel" className="input" autoComplete="tel-national" placeholder="10-digit mobile" required {...inv("phone")} />{err("phone")}</div>
                  <div className="field"><label htmlFor="ci-email">Email</label><input id="ci-email" name="email" type="email" inputMode="email" className="input" autoComplete="email" required {...inv("email")} />{err("email")}</div>
                </div>
                <fieldset className="field circle__bday">
                  <legend className="label">Birthday <span className="muted">(for your gift)</span></legend>
                  <div className="circle__row">
                    <select name="bday" className="select" aria-label="Day" defaultValue=""><option value="">Day</option>{Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => <option key={d} value={d}>{Number(d)}</option>)}</select>
                    <select name="bmonth" className="select" aria-label="Month" defaultValue=""><option value="">Month</option>{MONTHS.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}</select>
                  </div>
                </fieldset>
                <label className="check circle__consent"><input type="checkbox" name="consent" required /> <span>{settings.consentText}</span></label>
                {err("consent")}
                <input name="company" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                {error && <p className="field-error" role="alert">{error}</p>}
                <button className="btn btn--block" disabled={state === "busy"}>{state === "busy" ? "Joining…" : settings.cta}</button>
                <button type="button" className="circle__skip" onClick={close}>Maybe later</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
