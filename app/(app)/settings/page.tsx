import { Settings as SettingsIcon, User, KeyRound, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, roleLabel } from "@/lib/auth";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { updateProfile, changePassword } from "./actions";

type SearchParams = Promise<{ error?: string; passwordChanged?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { error, passwordChanged } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your profile and password"
      />

      {/* Profile */}
      <form action={updateProfile} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2">
          <User className="size-4 text-[#00e8ff]" />
          <h2 className="font-display font-semibold text-base">Profile</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email ?? ""} disabled />
          <p className="text-xs text-[#8a92b4]">
            Email can&apos;t be changed from here.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            name="display_name"
            required
            defaultValue={profile.display_name}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="instruments">Instruments</Label>
          <Input
            id="instruments"
            name="instruments"
            placeholder="e.g. acoustic, vocals, keys"
            defaultValue={profile.instruments.join(", ")}
          />
          <p className="text-xs text-[#8a92b4]">Comma-separated.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Role</Label>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#00e8ff]/10 text-[#00e8ff] border border-[#00e8ff]/30 font-semibold">
              {roleLabel(profile.role)}
            </span>
            <span className="text-[#8a92b4]">
              {profile.role === "leader"
                ? "You can manage the song library, setlists, schedule, and devotions."
                : "Ask an editor to upgrade your account if you need to add or edit content."}
            </span>
          </div>
        </div>

        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
      </form>

      {/* Password */}
      <form action={changePassword} className="glass p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-[#8b5cf6]" />
          <h2 className="font-display font-semibold text-base">Change password</h2>
        </div>

        {passwordChanged && (
          <p className="flex items-center gap-2 text-sm text-[#8eff6a] bg-[#8eff6a]/10 border border-[#8eff6a]/30 rounded-lg p-2">
            <CheckCircle2 className="size-4" /> Password updated.
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="text-sm text-[#ff5566] bg-[#ff5566]/10 border border-[#ff5566]/30 rounded-lg p-2">
            {error}
          </p>
        )}

        <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
      </form>
    </div>
  );
}
