import "server-only";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "./session";

/**
 * Nemara Studio credentials live in environment variables only:
 *   ADMIN_EMAIL, ADMIN_PASSWORD_HASH ("scrypt:<saltHex>:<hashHex>"), ADMIN_SESSION_SECRET (≥32 chars).
 * Generate a hash with:  node scripts/hash-password.mjs "your-password"
 */
export function verifyCredentials(email: string, password: string): boolean {
  const want = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const stored = process.env.ADMIN_PASSWORD_HASH ?? "";
  const [algo, salt, hash] = stored.split(":");
  if (!want || algo !== "scrypt" || !salt || !hash) return false;
  const got = scryptSync(password, Buffer.from(salt, "hex"), 64);
  const expected = Buffer.from(hash, "hex");
  const passOk = expected.length === got.length && timingSafeEqual(got, expected);
  return passOk && email.trim().toLowerCase() === want;
}

/** Use at the top of every Studio page and server action (defence in depth behind the proxy). */
export async function requireAdmin(): Promise<{ email: string }> {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  return session;
}
export const adminConfigured = () => !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && (process.env.ADMIN_SESSION_SECRET ?? "").length >= 32);
