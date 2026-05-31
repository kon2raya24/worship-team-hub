"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function MfaChallenge() {
  const router = useRouter();
  const params = useSearchParams();
  // Guard against open-redirects: only allow same-site relative paths.
  const raw = params.get("next");
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const [supabase] = useState(createClient);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setError("Couldn't load your 2FA factor.");
        return;
      }
      const totp =
        data?.totp?.find((f) => f.status === "verified") ?? data?.totp?.[0];
      if (totp) setFactorId(totp.id);
      else setError("No 2FA factor found on this account.");
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || busy) return;
    setBusy(true);
    setError(null);
    const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (cErr || !ch) {
      setBusy(false);
      setError("Couldn't start verification. Try again.");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code: code.trim(),
    });
    if (vErr) {
      setBusy(false);
      setError("That code didn't match. Try again.");
      return;
    }
    // Session is now AAL2 — proceed.
    router.replace(next);
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <ShieldCheck className="size-5 text-[#8eff6a]" /> Two-factor
        </h2>
        <p className="text-sm text-[#8a92b4]">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>
      <form onSubmit={verify} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Authentication code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            autoFocus
            required
          />
        </div>
        {error && (
          <p className="text-sm text-[#ff5566] bg-[#ff5566]/10 border border-[#ff5566]/30 rounded-lg p-2">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full gap-2"
          disabled={busy || code.length < 6 || !factorId}
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {busy ? "Verifying…" : "Verify"}
        </Button>
      </form>
      <button
        type="button"
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace("/login");
        }}
        className="w-full text-center text-xs text-[#8a92b4] hover:text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

export default function MfaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-10 text-[#8a92b4]">
          <Loader2 className="size-5 animate-spin" />
        </div>
      }
    >
      <MfaChallenge />
    </Suspense>
  );
}
