// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

const PUBLIC_PATHS = ["/auth/sign-in", "/_next", "/favicon.ico", "/robots.txt", "/manifest.webmanifest"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const url = new URL("/auth/sign-in", req.url);
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }
  if (user && pathname === "/auth/sign-in") {
    const to = req.nextUrl.searchParams.get("next") || "/";
    return NextResponse.redirect(new URL(to, req.url));
  }
  return res;
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
