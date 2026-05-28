"use client";

import Script from "next/script";

// Cloudflare Turnstile (bot protection) for the auth forms. Implicit-render
// mode: the script finds the .cf-turnstile div and, on success, injects a
// hidden `cf-turnstile-response` input into the enclosing <form>, which the
// server action reads and passes to Supabase as the captchaToken.
//
// Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so adding this
// can't break sign-in before you've configured Turnstile in Cloudflare +
// Supabase (Auth → enable CAPTCHA → Turnstile + secret key).
export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme="dark"
        data-size="flexible"
      />
    </>
  );
}
