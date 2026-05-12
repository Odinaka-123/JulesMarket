import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("admin-session");
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");

  // Don't touch API routes
  if (isApiRoute) return NextResponse.next();

  // Redirect to login if accessing admin without session
  if (isAdminRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if already logged in and visiting login
  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};