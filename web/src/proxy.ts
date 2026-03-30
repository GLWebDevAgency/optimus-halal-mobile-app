import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side route protection for admin pages (Next.js 16 proxy).
 *
 * The admin dashboard uses localStorage tokens + tRPC adminProcedure
 * for actual auth. This proxy adds a defense-in-depth layer:
 * it checks for the presence of a session marker cookie set at login.
 * Without it, the server won't even serve the admin page bundles.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only gate /admin routes (except login page)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = request.cookies.has("naqiy_admin_session");

    if (!hasSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
