"use client";
import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setState("busy"); setErrors({});
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await r.json();
      if (!r.ok) { setErrors(d.fields ?? {}); throw new Error(d.error || "Please check the form."); }
      setState("ok"); setMsg("Thank you — we'll write back within one working day.");
      e.currentTarget.reset();
    } catch (err) { setState("err"); setMsg((err as Error).message); }
  }
  if (state === "ok") return <div className="form-done"><p className="hand">received, with thanks.</p><p>{msg}</p></div>;
  const f = (name: string) => ({ "aria-invalid": errors[name] ? true : undefined, "aria-describedby": errors[name] ? `${name}-err` : undefined });
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form__row">
        <div className="field"><label htmlFor="c-name">Your name</label><input id="c-name" name="name" className="input" required autoComplete="name" {...f("name")} />{errors.name && <span id="name-err" className="field-error">{errors.name}</span>}</div>
        <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" className="input" required autoComplete="email" {...f("email")} />{errors.email && <span id="email-err" className="field-error">{errors.email}</span>}</div>
      </div>
      <div className="field"><label htmlFor="c-topic">About</label>
        <select id="c-topic" name="topic" className="select" defaultValue="Choosing a piece"><option>Choosing a piece</option><option>An existing order</option><option>Gifting & bulk orders</option><option>Press & collaborations</option><option>Artists — work with us</option><option>Something else</option></select></div>
      <div className="field"><label htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" className="textarea" required minLength={10} maxLength={2000} {...f("message")} />{errors.message && <span id="message-err" className="field-error">{errors.message}</span>}</div>
      <input name="company" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {state === "err" && <p className="field-error" role="alert">{msg}</p>}
      <button className="btn" disabled={state === "busy"}>{state === "busy" ? "Sending…" : "Send to Nemara"}</button>
    </form>
  );
}
