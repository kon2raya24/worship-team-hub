import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

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
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");
  const isPasswordResetRoute = pathname.startsWith("/reset-password");
  const isPublicRoute =
    pathname.startsWith("/share") ||
    pathname.startsWith("/auth") ||
    pathname === "/offline";

  if (!user && !isAuthRoute && !isPasswordResetRoute && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users hitting /login or /signup go back to dashboard,
  // but /reset-password is allowed to stay (user just clicked email link).
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Opt-in 2FA enforcement: a user who enrolled a verified factor must finish
  // the code step (reach AAL2) before any protected route. Accounts without a
  // factor report nextLevel "aal1", so they are never redirected here.
  const isMfaRoute = pathname.startsWith("/mfa");
  // NOTE: /reset-password is intentionally NOT exempt from the AAL step-up. A
  // 2FA-enrolled account must clear AAL2 before it can set a new password, so a
  // password-only (AAL1) session can't bypass 2FA via the reset page. A genuine
  // recovery session for a non-2FA account stays aal1/aal1 and is unaffected; a
  // 2FA recovery session completes /mfa (which preserves ?next) and returns.
  if (
    user &&
    !isMfaRoute &&
    !isAuthRoute &&
    !isPublicRoute
  ) {
    try {
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
        const url = request.nextUrl.clone();
        url.pathname = "/mfa";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      // Fail open — never lock anyone out over an MFA-status hiccup.
    }
  }

  return response;
}
