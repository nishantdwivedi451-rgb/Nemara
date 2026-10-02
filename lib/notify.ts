import "server-only";

/**
 * Outbound notifications. Configure any of:
 *  - ORDER_WEBHOOK_URL / LEAD_WEBHOOK_URL: POST JSON to Zapier, Make, n8n, Google Apps Script, Slack…
 *  - RESEND_API_KEY + NOTIFY_EMAIL_TO (+ NOTIFY_EMAIL_FROM): email via Resend.
 * Failures are logged, never surfaced to customers.
 */
export async function notify(kind: "order" | "contact" | "newsletter", payload: Record<string, unknown>) {
  // kinds: order → ORDER_WEBHOOK_URL; contact/newsletter (incl. Circle sign-ups & daily digest) → LEAD_WEBHOOK_URL
  const tasks: Promise<unknown>[] = [];
  const hook = kind === "order" ? process.env.ORDER_WEBHOOK_URL : process.env.LEAD_WEBHOOK_URL || process.env.ORDER_WEBHOOK_URL;
  if (hook) tasks.push(fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...payload, at: new Date().toISOString() }) }));
  const key = process.env.RESEND_API_KEY, to = process.env.NOTIFY_EMAIL_TO;
  if (key && to) {
    const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    tasks.push(fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_EMAIL_FROM || "Nemara <onboarding@resend.dev>", to: [to],
        subject: `Nemara · new ${kind}${payload.reference ? ` ${payload.reference}` : ""}`,
        html: `<pre style="font:13px/1.5 monospace">${esc(JSON.stringify(payload, null, 2))}</pre>`,
      }),
    }));
  }
  if (!tasks.length) { console.info(`[notify:${kind}]`, JSON.stringify(payload)); return; }
  const results = await Promise.allSettled(tasks);
  results.forEach((r) => r.status === "rejected" && console.error(`[notify:${kind}] failed`, r.reason));
}
