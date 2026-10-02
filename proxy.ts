import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/session";

/**
 * Guards Nemara Studio. Every /admin page and /api/admin endpoint requires a valid signed
 * session; the dedicated admin hostname (ADMIN_HOST, e.g. nemara-admin.vercel.app) only serves the Studio.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const adminHost = process.env.ADMIN_HOST;
  const onAdminHost = !!adminHost && host.startsWith(adminHost);

  if (onAdminHost && pathname === "/") return NextResponse.redirect(new URL("/admin", req.url));

  const isStudio = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isStudio || pathname === "/admin/login") {
    const res = NextResponse.next();
    if (isStudio) res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// Only Studio routes (and "/" for the admin hostname) pass through the proxy — storefront stays fully static.
export const config = { matcher: ["/", "/admin/:path*", "/api/admin/:path*"] };
