import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { isAuthPath, isProtectedPath, loginUrl } from "@/lib/paths";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isAuthPath(pathname) || pathname.startsWith("/api/") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session) return NextResponse.next();

  const next = `${pathname}${request.nextUrl.search}`;
  return NextResponse.redirect(new URL(loginUrl(next), request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg|placeholders|icon.svg).*)"],
};
