import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIES, verifySession } from "@/lib/session";

// Fast redirect for signed-out visitors. Pages and server actions still call
// requireAdmin()/requireCustomer(), which is the real authorization check.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const publicAdminPages = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  if (pathname.startsWith("/admin") && !publicAdminPages.includes(pathname)) {
    const ok = await verifySession(request.cookies.get(SESSION_COOKIES.admin)?.value, "admin");
    if (!ok) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account") && !["/account/login", "/account/register"].includes(pathname)) {
    const ok = await verifySession(request.cookies.get(SESSION_COOKIES.customer)?.value, "customer");
    if (!ok) {
      const url = new URL("/account/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
