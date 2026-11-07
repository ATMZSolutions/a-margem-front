import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSession } from "./src/lib/adminSession";
import { getAdminConfig } from "./src/lib/adminConfig";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  const isAdminUi = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/") || pathname === "/api/admin";
  const isUpload = pathname === "/api/upload" || pathname.startsWith("/api/upload/");
  if (!isAdminUi && !isAdminApi && !isUpload) return NextResponse.next();

  try {
    getAdminConfig();
    const token = req.cookies.get("a_token")?.value;
    if (token && await validateSession(token)) return NextResponse.next();
  } catch {
    return NextResponse.json({ error: "Admin authentication is not configured" }, { status: 503 });
  }

  if (isAdminUi) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/upload/:path*"],
};
