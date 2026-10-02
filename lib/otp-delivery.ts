import "server-only";
import { PREVIEW_MODE } from "@/lib/site";

/**
 * OTP delivery. Email: Resend (RESEND_API_KEY + OTP_EMAIL_FROM on a verified domain).
 * SMS (India): MSG91 flow (MSG91_AUTH_KEY + MSG91_OTP_TEMPLATE_ID, DLT-approved template with ##otp##)
 * or Twilio (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM).
 * With no provider, the preview edition shows the code on screen (clearly labelled); live mode refuses.
 */
export type Channel = "phone" | "email";

export const providerFor = (c: Channel) =>
  c === "email" ? (process.env.RESEND_API_KEY ? "resend" : null)
    : process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID ? "msg91"
      : process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM ? "twilio" : null;

/** Show codes on screen only in the preview edition when no provider is connected. */
export const devCodes = (c: Channel) => !providerFor(c) && (PREVIEW_MODE || process.env.NODE_ENV !== "production");

export async function deliverOtp(channel: Channel, target: string, code: string): Promise<"sent" | "dev"> {
  const provider = providerFor(channel);
  if (!provider) {
    if (devCodes(channel)) return "dev";
    throw new Error(channel === "email" ? "Email codes aren't available right now." : "SMS codes aren't available right now.");
  }
  let res: Response;
  if (provider === "resend") {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.OTP_EMAIL_FROM || process.env.NOTIFY_EMAIL_FROM || "Nemara <onboarding@resend.dev>", to: [target],
        subject: `${code} is your Nemara code`,
        text: `Your Nemara verification code is ${code}. It expires in 10 minutes. If you didn't ask for it, ignore this email.`,
        html: `<div style="font-family:Georgia,serif;color:#21102A;padding:24px"><p style="letter-spacing:.3em;font-size:12px;color:#4B1D5C">NEMARA</p><p>Your verification code</p><p style="font-size:34px;letter-spacing:.2em;margin:8px 0">${code}</p><p style="color:#5A5260;font-size:13px">It expires in 10 minutes. If you didn't ask for it, you can ignore this email.</p></div>`,
      }),
    });
  } else if (provider === "msg91") {
    res = await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST", headers: { authkey: process.env.MSG91_AUTH_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: process.env.MSG91_OTP_TEMPLATE_ID, short_url: "0", recipients: [{ mobiles: `91${target}`, otp: code }] }),
    });
  } else {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: `+91${target}`, From: process.env.TWILIO_FROM!, Body: `${code} is your Nemara verification code. It expires in 10 minutes.` }),
    });
  }
  if (!res.ok) { console.error(`[otp] ${provider} failed`, res.status, await res.text().catch(() => "")); throw new Error("We couldn't send the code. Please try again."); }
  return "sent";
}
