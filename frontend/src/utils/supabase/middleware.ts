// src/utils/supabase/middleware.ts
// Refreshes Supabase session and enforces auth protection on dashboard routes

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Routes that require authentication
const PROTECTED_ROUTES = ["/student", "/mentor", "/admin"];
// Routes that logged-in users should NOT see
const AUTH_ROUTES = ["/login"];

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as any)
        );
      },
    },
  });

  // IMPORTANT: Do not add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login page
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && user) {
    // Query profile to get role for redirect
    const { data: profile } = await supabase
      .from("Profile")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const redirectUrl = request.nextUrl.clone();
    if (role === "mentee") redirectUrl.pathname = "/student/dashboard";
    else if (role === "mentor") redirectUrl.pathname = "/mentor/dashboard";
    else if (role === "admin") redirectUrl.pathname = "/admin/dashboard";
    else redirectUrl.pathname = "/student/dashboard";

    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
};
