import { NextRequest, NextResponse } from "next/server";

// Domains that serve the marketing site
const MARKETING_DOMAINS = new Set(["trackio.au", "www.trackio.au"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const isMarketingDomain = MARKETING_DOMAINS.has(hostname);

  // ─── Marketing domain routing ────────────────────────────────────────────────
  if (isMarketingDomain) {
    // Always allow static assets, API routes, and legal pages
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/privacy-policy") ||
      pathname.startsWith("/terms-of-service") ||
      pathname === "/favicon.ico" ||
      pathname === "/robots.txt" ||
      pathname === "/sitemap.xml" ||
      /\.(png|svg|jpg|jpeg|ico|webp|woff2?)$/.test(pathname)
    ) {
      return NextResponse.next();
    }

    // www → apex redirect for SEO canonical
    if (hostname === "www.trackio.au") {
      const url = new URL(request.url);
      url.hostname = "trackio.au";
      return NextResponse.redirect(url, { status: 301 });
    }

    // Rewrite root to /welcome so the URL stays as trackio.au/
    if (pathname === "/" || pathname === "/welcome") {
      const url = request.nextUrl.clone();
      url.pathname = "/welcome";
      return NextResponse.rewrite(url);
    }

    // Sign in / app links → redirect to app subdomain
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/setup") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password")
    ) {
      return NextResponse.redirect(`https://app.trackio.au${pathname}`, { status: 302 });
    }

    // All other paths on marketing domain → back to root
    return NextResponse.redirect(new URL("/", request.url), { status: 301 });
  }

  // ─── App domain routing (app.trackio.au / localhost) ────────────────────────

  // Public routes — no auth check needed
  if (
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/privacy-policy") ||
    pathname.startsWith("/terms-of-service") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth uses this)
  const sessionToken =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)"],
};
