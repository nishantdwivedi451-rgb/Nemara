// Signed admin session tokens — Web Crypto only, so this runs in the proxy and in route handlers.
export const SESSION_COOKIE = "nemara_studio";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function key() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(email: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ e: email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL })));
  const sig = await crypto.subtle.sign("HMAC", await key(), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined | null): Promise<{ email: string } | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify("HMAC", await key(), fromB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { e: string; exp: number };
    if (data.exp < Date.now() / 1000) return null;
    if (data.e.toLowerCase() !== (process.env.ADMIN_EMAIL ?? "").toLowerCase()) return null;
    return { email: data.e };
  } catch { return null; }
}
