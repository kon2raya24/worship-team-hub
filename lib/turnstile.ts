// Server-side Cloudflare Turnstile verification.
//
// We verify the widget token HERE (in the web server actions) rather than via
// Supabase's CAPTCHA setting, on purpose: Supabase CAPTCHA is project-global,
// so enabling it would force a token onto the Flutter app's password/biometric
// sign-in too (which don't send one) and break mobile login. Verifying here
// keeps bot protection a web-only concern.
//
// Dormant until TURNSTILE_SECRET_KEY is set (returns true), so this can't block
// sign-in before you've configured Turnstile.

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | undefined
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured → don't block anyone
  if (!token) return false; // configured but no token → reject
  try {
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Fail closed when configured — a verification outage shouldn't be a
    // bypass. (Cloudflare's siteverify is highly available.)
    return false;
  }
}
