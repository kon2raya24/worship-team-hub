"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Status = "loading" | "off" | "enrolling" | "on";

// Opt-in TOTP two-factor auth via Supabase MFA. Enroll shows a QR + secret to
// scan into an authenticator app, then a 6-digit code verifies the factor.
export function TwoFactorSetup() {
  const [supabase] = useState(createClient);
  const [status, setStatus] = useState<Status>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.mfa.listFactors().then(({ data }) => {
      if (!active) return;
      const verified = data?.totp?.find((f) => f.status === "verified");
      setStatus(verified ? "on" : "off");
      setFactorId(verified?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, [supabase]);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    // Clear any stale half-finished factors so enroll doesn't collide.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const f of existing?.all ?? []) {
      if (f.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });
    setBusy(false);
    if (error || !data) {
      setError(error?.message ?? "Couldn't start setup. Try again.");
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStatus("enrolling");
  }

  async function verifyEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || busy) return;
    setBusy(true);
    setError(null);
    const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (cErr || !ch) {
      setBusy(false);
      setError("Couldn't verify the code. Try again.");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) {
      setError("That code didn't match. Check your app and try again.");
      return;
    }
    setQr(null);
    setSecret(null);
    setCode("");
    setStatus("on");
  }

  async function disable() {
    if (!factorId || busy) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setFactorId(null);
    setStatus("off");
  }

  function cancelEnroll() {
    if (factorId) supabase.auth.mfa.unenroll({ factorId });
    setQr(null);
    setSecret(null);
    setCode("");
    setFactorId(null);
    setError(null);
    setStatus("off");
  }

  return (
    <div className="glass p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-chart-5" />
        <h2 className="font-display font-semibold text-base">
          Two-factor authentication
        </h2>
      </div>

      {status === "loading" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Checking status…
        </p>
      )}

      {status === "off" && (
        <>
          <p className="text-sm text-muted-foreground">
            Add a second step at sign-in using an authenticator app (Google
            Authenticator, Authy, 1Password). Recommended for editors.
          </p>
          <Button onClick={startEnroll} disabled={busy} className="gap-2">
            {busy && <Loader2 className="size-4 animate-spin" />}
            Enable 2FA
          </Button>
        </>
      )}

      {status === "enrolling" && (
        <form onSubmit={verifyEnroll} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan this with your authenticator app, then enter the 6-digit code
            it shows.
          </p>
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="2FA QR code"
              className="size-44 rounded-lg bg-white p-2"
            />
          )}
          {secret && (
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Or enter this key manually
              </Label>
              <code className="block text-xs font-mono break-all rounded-lg bg-tint-1 border border-border p-2 text-foreground/90">
                {secret}
              </code>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="totp-code">6-digit code</Label>
            <Input
              id="totp-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={busy || code.length < 6} className="gap-2">
              {busy && <Loader2 className="size-4 animate-spin" />}
              Verify &amp; enable
            </Button>
            <Button type="button" variant="outline" onClick={cancelEnroll} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {status === "on" && (
        <>
          <p className="flex items-center gap-2 text-sm text-chart-5">
            <ShieldCheck className="size-4" /> 2FA is on. You&apos;ll enter a
            code from your app at sign-in.
          </p>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2">
              {error}
            </p>
          )}
          <Button
            onClick={disable}
            disabled={busy}
            variant="outline"
            className="gap-2"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldOff className="size-4" />
            )}
            Disable 2FA
          </Button>
        </>
      )}
    </div>
  );
}
