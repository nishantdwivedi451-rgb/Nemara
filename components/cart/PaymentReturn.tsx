"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useStore } from "@/components/layout/StoreProvider";
import { track } from "@/lib/analytics";

type Pending = { provider: string; orderId: string; lines: unknown[]; address: Record<string, unknown>; items: { name: string; handle: string; image: string }[] };

/** Landing page after the PhonePe payment page: asks our server (which asks PhonePe) whether the order is paid. */
function Confirm() {
  const params = useSearchParams();
  const router = useRouter();
  const { clear } = useStore();
  const [state, setState] = useState<"checking" | "pending" | "failed" | "missing">("checking");
  const [msg, setMsg] = useState("");
  const tries = useRef(0);

  useEffect(() => {
    const orderId = params.get("order") ?? "";
    let pending: Pending | null = null;
    try { pending = JSON.parse(sessionStorage.getItem("nemara:pending-payment") ?? "null"); } catch { /* ignore */ }
    if (!pending || pending.orderId !== orderId) { setState("missing"); return; }
    const p = pending;
    let timer: number | undefined;
    const check = async () => {
      tries.current += 1;
      const r = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: p.provider, orderId: p.orderId, lines: p.lines, address: p.address }) });
      const d = await r.json().catch(() => ({}));
      if (r.status === 202 || r.status === 502) {
        setState("pending");
        if (tries.current < 12) timer = window.setTimeout(check, 5000);
        return;
      }
      if (!r.ok) { setState("failed"); setMsg(d.error ?? "The payment didn't go through."); return; }
      track("purchase", { transaction_id: d.reference, value: d.total, currency: "INR", items: p.lines.length });
      try {
        sessionStorage.setItem("nemara:last-order", JSON.stringify({ reference: d.reference, items: p.items, total: d.total, demo: d.demo }));
        sessionStorage.removeItem("nemara:pending-payment");
      } catch { /* ignore */ }
      clear();
      router.replace(`/checkout/success?ref=${encodeURIComponent(d.reference)}`);
    };
    check();
    return () => window.clearTimeout(timer);
  }, [params, router, clear]);

  return (
    <section className="wrap page-head pay-return" aria-live="polite">
      {state === "checking" && <><p className="eyebrow">One moment</p><h1 className="h1">Confirming your payment…</h1><p className="lede">Please don&apos;t close this page.</p></>}
      {state === "pending" && <><p className="eyebrow">Almost there</p><h1 className="h1">Your payment is being processed.</h1><p className="lede">This can take a minute with some banks. We&apos;ll keep checking — and if it completes later, we&apos;ll confirm your order by email and WhatsApp.</p></>}
      {state === "failed" && <><p className="eyebrow">Payment not completed</p><h1 className="h1">No money was taken.</h1><p className="lede">{msg}</p><Link href="/checkout" className="btn">Try again</Link></>}
      {state === "missing" && <><p className="eyebrow">Payment</p><h1 className="h1">We couldn&apos;t find this checkout.</h1><p className="lede">If money was deducted, your order will be confirmed by email shortly — or contact us with your payment reference.</p><Link href="/contact" className="btn btn--ghost">Contact us</Link></>}
    </section>
  );
}

export function PaymentReturn() {
  return <Suspense fallback={null}><Confirm /></Suspense>;
}
