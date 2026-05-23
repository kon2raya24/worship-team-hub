import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function signupAction(formData: FormData) {
  "use server";
  const display_name = String(formData.get("display_name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
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
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Join your church worship team hub.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={signupAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Name</Label>
            <Input id="display_name" name="display_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">Create account</Button>
          <p className="text-center text-sm text-zinc-500">
            Already have one?{" "}
            <Link className="underline" href="/login">Sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
