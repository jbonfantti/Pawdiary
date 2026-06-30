import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isIosNativeShell } from "@/lib/native/platform";

const PUBLIC_PATHS = ["/demo", "/legal", "/api/webhooks", "/api/review-bypass", "/sign-in", "/sign-up"];

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent");

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!isPublic && isIosNativeShell(userAgent) && pathname === "/") {
    return NextResponse.redirect(new URL("/demo", request.url));
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: https:`,
    `connect-src 'self' https:`,
    `frame-ancestors 'none'`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
