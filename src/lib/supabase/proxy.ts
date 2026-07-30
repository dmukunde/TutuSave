import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/", "/login", "/signup"];

// Refreshes the Supabase auth session cookie on every request, and performs
// an optimistic redirect for protected vs. public routes. This is a
// convenience check only — real authorization still happens in the DAL
// (src/lib/supabase/dal.ts) close to the data.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Revalidates the token with the Supabase Auth server (not just a local
  // JWT decode) and transparently refreshes it if expired.
  const { data } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // The invite-join page must be visible before login — it's the whole
  // point of showing "you've been invited" before pushing someone through
  // signup — so it's a prefix match, not just the exact publicRoutes list.
  const isPublicRoute =
    publicRoutes.includes(path) || path.startsWith("/goals/shared/join/");

  if (!data.user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (data.user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
