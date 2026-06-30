import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // Public routes — always allow through
  if (pathname === "/" || pathname === "/login") return res;

  // Not logged in — send to landing page (not /login)
  if (!user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Get role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;

  // Role not yet assigned (profile missing) — let them through to avoid loop
  if (!role) return res;

  // Member trying to access admin routes
  if (
    role === "member" &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/members") ||
      pathname.startsWith("/analytics") ||
      pathname.startsWith("/reports"))
  ) {
    return NextResponse.redirect(new URL("/member-portal", req.url));
  }

  // Admin trying to access member portal
  if (role === "admin" && pathname.startsWith("/member-portal")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uccp-logo.png).*)"],
};