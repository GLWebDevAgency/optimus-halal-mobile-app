import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side route protection for admin pages.
 *
 * The admin dashboard uses localStorage tokens + tRPC adminProcedure
 * for actual auth. This middleware adds a defense-in-depth layer:
 * it checks for the presence of a session marker cookie set at login.
 * Without it, the server won't even serve the admin page bundles.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page itself
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Check for admin session marker cookie
  const hasSession = request.cookies.has("naqiy_admin_session");

  if (!hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
