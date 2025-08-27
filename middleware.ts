import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow login page and Next assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  // For API:
  if (pathname.startsWith("/api")) {
    // Allow auth endpoints without session
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }
    const hasSession = req.cookies.get("session");
    if (!hasSession /* && process.env.SKIP_AUTH !== "1" */) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
    return NextResponse.next();
  }

  // For pages:
  const hasSession = req.cookies.get("session");
  if (!hasSession /* && process.env.SKIP_AUTH !== "1" */) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", pathname || "/");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
