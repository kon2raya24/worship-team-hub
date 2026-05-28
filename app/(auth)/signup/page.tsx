import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { friendlyAuthError } from "@/lib/auth-errors";

async function signupAction(formData: FormData) {
  "use server";
  const display_name = String(formData.get("display_name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const captchaToken =
    String(formData.get("cf-turnstile-response") ?? "") || undefined;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name }, captchaToken },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(friendlyAuthError(error.message))}`);
  }
  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account.");
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Create account</h2>
        <p className="text-sm text-[#8a92b4]">Join your church worship team.</p>
      </div>
      <form action={signupAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Name</Label>
          <Input
            id="display_name"
            name="display_name"
            required
            autoComplete="name"
            enterKeyHint="next"
            autoCapitalize="words"
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            enterKeyHint="go"
          />
        </div>
        {error && (
          <p className="text-sm text-[#ff5566] bg-[#ff5566]/10 border border-[#ff5566]/30 rounded-lg p-2">
            {error}
          </p>
        )}
        <TurnstileWidget />
        <SubmitButton className="w-full" pendingLabel="Creating…">
          Create account
        </SubmitButton>
        <p className="text-center text-sm text-[#8a92b4]">
          Already have one?{" "}
          <Link className="text-[#00e8ff] hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
