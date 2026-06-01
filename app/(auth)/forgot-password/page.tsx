import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { verifyTurnstile } from "@/lib/turnstile";
import { friendlyAuthError } from "@/lib/auth-errors";

async function resetAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const captchaToken =
    String(formData.get("cf-turnstile-response") ?? "") || undefined;
  if (!email) {
    redirect("/forgot-password?error=Email%20required");
  }
  if (!(await verifyTurnstile(captchaToken))) {
    redirect(
      `/forgot-password?error=${encodeURIComponent("Verification failed — please try again.")}`
    );
  }

  const supabase = await createClient();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://worship-team-hub.vercel.app";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }
  redirect("/forgot-password?sent=1");
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Reset password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-[#00e8ff]/30 bg-[#00e8ff]/10 p-3 text-sm text-foreground/80">
          Check your email for a reset link. It expires in 1 hour.
        </div>
      ) : (
        <form action={resetAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="send"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          {error && (
            <p className="text-sm text-[#ff5566] bg-[#ff5566]/10 border border-[#ff5566]/30 rounded-lg p-2">
              {error}
            </p>
          )}
          <TurnstileWidget />
          <SubmitButton className="w-full" pendingLabel="Sending…">
            Send reset link
          </SubmitButton>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        <Link className="text-accent hover:underline" href="/login">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
