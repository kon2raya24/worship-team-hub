import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { friendlyAuthError } from "@/lib/auth-errors";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(friendlyAuthError(error.message))}&next=${encodeURIComponent(next)}`
    );
  }

  // If this account enrolled a second factor, require the code step before
  // landing on a protected page. Accounts without 2FA have nextLevel "aal1".
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    redirect(`/mfa?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next = "/" } = await searchParams;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Sign in</h2>
        <p className="text-sm text-[#8a92b4]">Welcome back.</p>
      </div>
      <form action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            enterKeyHint="next"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#8a92b4] hover:text-[#00e8ff] transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            enterKeyHint="go"
          />
        </div>
        {error && (
          <p className="text-sm text-[#ff5566] bg-[#ff5566]/10 border border-[#ff5566]/30 rounded-lg p-2">
            {error}
          </p>
        )}
        <SubmitButton className="w-full" pendingLabel="Signing in…">
          Sign in
        </SubmitButton>
        <p className="text-center text-sm text-[#8a92b4]">
          New to the team?{" "}
          <Link className="text-[#00e8ff] hover:underline" href="/signup">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
