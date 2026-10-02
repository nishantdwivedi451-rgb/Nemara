"use client";
import { useState } from "react";
import { track } from "@/lib/analytics";

export function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: fd.get("email"), company: fd.get("company") }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong");
      setState("ok"); setMsg("You're on the list. The next story arrives soon.");
      track("newsletter_signup", { placement: "footer" });
    } catch (err) { setState("err"); setMsg((err as Error).message); }
  }
  return (
    <form className={`newsletter ${dark ? "newsletter--dark" : ""}`} onSubmit={submit} noValidate>
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <div className="newsletter__row">
        <input id="nl-email" name="email" type="email" required placeholder="Your email" autoComplete="email" className="newsletter__input" disabled={state === "ok"} />
        <input name="company" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button className="newsletter__btn" disabled={state === "busy" || state === "ok"}>{state === "busy" ? "…" : "Join"}</button>
      </div>
      <p className={`newsletter__msg ${state === "err" ? "is-err" : ""}`} role="status">{msg}</p>
    </form>
  );
}
