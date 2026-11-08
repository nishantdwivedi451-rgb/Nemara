import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/session";

/**
 * Guards Nemara Studio. Every /admin page and /api/admin endpoint requires a valid signed
 * session; the dedicated admin hostnames (ADMIN_HOST, comma-separated, e.g. "admin.nemara.shop,nemara-admin")
 * open the Studio at "/".
 */
// Product images may only be embedded by Nemara itself (and search engines). Direct visits and social
// link previews send no Referer and still work; another shop hotlinking our photos gets a 403.
const IMAGE_REFERERS = /(^|\.)(nemara\.shop|vercel\.app|localhost|google\.[a-z.]+|bing\.com|duckduckgo\.com)$/i;

function hotlinkBlocked(req: NextRequest): boolean {
  const ref = req.headers.get("referer");
  if (!ref) return false;
  try {
    const refHost = new URL(ref).hostname;
    return refHost !== req.nextUrl.hostname && !IMAGE_REFERERS.test(refHost);
  } catch { return true; }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/products/")) {
    return hotlinkBlocked(req) ? new NextResponse("Image not available", { status: 403 }) : NextResponse.next();
  }
  const host = req.headers.get("host") ?? "";
  const adminHosts = (process.env.ADMIN_HOST ?? "").split(",").map((h) => h.trim()).filter(Boolean);
  const onAdminHost = adminHosts.some((h) => host.startsWith(h));

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

// Only Studio routes, "/" (admin hostname) and product images pass through the proxy — storefront pages stay fully static.
export const config = { matcher: ["/", "/admin/:path*", "/api/admin/:path*", "/products/:path*"] };
