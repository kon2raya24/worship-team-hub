import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles Supabase auth email callbacks:
 *   - Email signup confirmation
 *   - Magic link login
 *   - Password reset (then forwards to /reset-password)
 *
 * Supabase sends users here with a `?code=...` query param. We exchange
 * the code for a session, then redirect to `next` (or "/").
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url)
      );
    }
  }

  return NextResponse.redirect(new URL(next, url));
}
