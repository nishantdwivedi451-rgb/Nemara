"use client";
import { useEffect, useRef, useState } from "react";
import { useStore, type AuthReason, type Customer } from "@/components/layout/StoreProvider";
import { track } from "@/lib/analytics";

type Step = "identify" | "code" | "register" | "code2" | "done";
type Res = { error?: string; devCode?: string; status?: string; customer?: Customer; regToken?: string; target?: string; channel?: "phone" | "email"; created?: boolean };

const COPY: Record<AuthReason, { title: string; sub: string }> = {
  account: { title: "Sign in or create your account", sub: "Track orders, save addresses and keep your wishlist on every device." },
  wishlist: { title: "Keep your wishlist forever", sub: "Sign in to save these pieces to your account — on your phone, laptop, anywhere." },
  checkout: { title: "Verify to place your order", sub: "A quick code on your mobile and email creates your account, saves your address and lets you track delivery." },
};

async function post(action: string, body: object): Promise<Res> {
  const r = await fetch(`/api/account/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  return r.ok ? d : { error: d.error ?? "Something went wrong. Please try again." };
}
const mask = (t: string, ch?: string) => (ch === "phone" ? `+91 ${t.slice(0, 2)}••••${t.slice(-3)}` : t.replace(/^(.).*?(@.*)$/, "$1•••$2"));

export function AuthFlow({ reason = "account", onDone, embedded = false }: { reason?: AuthReason; onDone?: (c: Customer) => void; embedded?: boolean }) {
  const { setCustomer, wishlist, notify } = useStore();
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"phone" | "email">("phone");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [regToken, setRegToken] = useState("");
  const [name, setName] = useState("");
  const [other, setOther] = useState("");
  const [otherTarget, setOtherTarget] = useState("");
  const [consent, setConsent] = useState(true);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (cooldown <= 0) return; const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000); return () => window.clearTimeout(t); }, [cooldown]);
  useEffect(() => { if (step === "code" || step === "code2") window.setTimeout(() => codeRef.current?.focus(), 50); }, [step]);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setError(""); try { await fn(); } finally { setBusy(false); } };
  const finish = (c: Customer, created?: boolean) => {
    setCustomer(c); setStep("done");
    track(created ? "newsletter_signup" : "page_view", { account: created ? "registered" : "signed_in", reason });
    notify(created ? `Welcome to Nemara, ${c.name.split(" ")[0]}` : `Welcome back, ${c.name.split(" ")[0]}`);
    onDone?.(c);
  };

  const start = () => run(async () => {
    const d = await post("start", { identifier });
    if (d.error) return setError(d.error);
    setChannel(d.channel!); setTarget(d.target!); setDevCode(d.devCode ?? null); setCode(""); setCooldown(30); setStep("code");
  });
  const verify = () => run(async () => {
    const d = await post("verify", { identifier: target, code });
    if (d.error) return setError(d.error);
    if (d.status === "signed_in" && d.customer) return finish(d.customer);
    setRegToken(d.regToken!); setDevCode(null); setStep("register");
  });
  const registerStart = () => run(async () => {
    const d = await post("register-start", { regToken, other });
    if (d.error) return setError(d.error);
    setOtherTarget(d.target!); setDevCode(d.devCode ?? null); setCode(""); setCooldown(30); setStep("code2");
  });
  const registerComplete = () => run(async () => {
    const d = await post("register-complete", { regToken, name, other: otherTarget, code, consent, wishlist });
    if (d.error) return setError(d.error);
    finish(d.customer!, true);
  });
  const resend = () => (step === "code" ? start() : registerStart());

  const otherLabel = channel === "phone" ? "Email address" : "Mobile number";
  const copy = COPY[reason];

  return (
    <div className={`auth ${embedded ? "auth--embedded" : ""}`}>
      {step !== "done" && <header className="auth__head"><h2 className="h3">{copy.title}</h2><p className="muted">{copy.sub}</p></header>}

      <ol className="auth__progress" aria-label="Progress">
        {(step === "register" || step === "code2" ? ["Verify mobile/email", "Your details", "Second code"] : ["Mobile or email", "Code"]).map((l, i) => {
          const idx = step === "identify" ? 0 : step === "code" ? 1 : step === "register" ? 1 : 2;
          return <li key={l} className={i <= idx ? "is-on" : ""}>{l}</li>;
        })}
      </ol>

      {devCode && (step === "code" || step === "code2") && (
        <p className="auth__dev" role="note">Preview edition — SMS & email delivery isn&apos;t connected yet, so here&apos;s your code: <b>{devCode}</b> <button type="button" className="text-link" onClick={() => setCode(devCode)}>Fill it in</button></p>
      )}

      {step === "identify" && (
        <form className="auth__form" onSubmit={(e) => { e.preventDefault(); start(); }}>
          <label className="field"><span className="label">Mobile number or email</span>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} inputMode="email" autoComplete="username" placeholder="98765 43210 or you@email.com" required autoFocus={!embedded} />
          </label>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="btn btn--block" disabled={busy || identifier.trim().length < 5}>{busy ? "Sending code…" : "Send code"}</button>
          <p className="auth__fine">New here? The same step creates your account. We never share your details.</p>
        </form>
      )}

      {(step === "code" || step === "code2") && (
        <form className="auth__form" onSubmit={(e) => { e.preventDefault(); step === "code" ? verify() : registerComplete(); }}>
          <p>Enter the 6-digit code sent to <b>{mask(step === "code" ? target : otherTarget, step === "code" ? channel : channel === "phone" ? "email" : "phone")}</b></p>
          <input ref={codeRef} className="input auth__code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" aria-label="Verification code" required />
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="btn btn--block" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : step === "code" ? "Verify" : "Create my account"}</button>
          <div className="auth__row">
            <button type="button" className="text-link" disabled={cooldown > 0 || busy} onClick={resend}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button>
            <button type="button" className="text-link" onClick={() => { setStep(step === "code" ? "identify" : "register"); setError(""); }}>Change {step === "code" ? (channel === "phone" ? "number" : "email") : otherLabel.toLowerCase()}</button>
          </div>
        </form>
      )}

      {step === "register" && (
        <form className="auth__form" onSubmit={(e) => { e.preventDefault(); registerStart(); }}>
          <p className="auth__ok">✓ {channel === "phone" ? "Mobile" : "Email"} verified — {mask(target, channel)}</p>
          <label className="field"><span className="label">Your name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required autoFocus /></label>
          <label className="field"><span className="label">{otherLabel}</span>
            <input className="input" value={other} onChange={(e) => setOther(e.target.value)} type={channel === "phone" ? "email" : "tel"} inputMode={channel === "phone" ? "email" : "tel"} autoComplete={channel === "phone" ? "email" : "tel-national"} required />
          </label>
          <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> <span>Send me order updates and Nemara Circle offers on WhatsApp, SMS and email.</span></label>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="btn btn--block" disabled={busy || name.trim().length < 2 || other.trim().length < 5}>{busy ? "Sending code…" : `Verify ${channel === "phone" ? "email" : "mobile"}`}</button>
        </form>
      )}

      {step === "done" && !embedded && <p className="auth__ok">✓ You&apos;re signed in.</p>}
    </div>
  );
}
