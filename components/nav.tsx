"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Music,
  ListMusic,
  Calendar,
  BookOpen,
  Heart,
  Megaphone,
  Files,
  Users,
  Gamepad2,
  LogOut,
  Settings as SettingsIcon,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(app)/actions";
import { roleLabel, type Role } from "@/lib/roles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type NavLink = { href: string; label: string; Icon: LucideIcon };

// Primary nav — shown as desktop pills and as the mobile bottom tab bar.
const PRIMARY: NavLink[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/songs", label: "Library", Icon: Music },
  { href: "/setlists", label: "Setlists", Icon: ListMusic },
  { href: "/schedule", label: "Schedule", Icon: Calendar },
];

// Secondary nav — shown inline on desktop, behind a "More" sheet on mobile.
const SECONDARY: NavLink[] = [
  { href: "/team", label: "Team", Icon: Users },
  { href: "/devotions", label: "Devotions", Icon: BookOpen },
  { href: "/prayer", label: "Prayer", Icon: Heart },
  { href: "/announcements", label: "News", Icon: Megaphone },
  { href: "/files", label: "Files", Icon: Files },
  { href: "/games", label: "Games", Icon: Gamepad2 },
];

const ALL_LINKS = [...PRIMARY, ...SECONDARY];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav({ displayName, role }: { displayName: string; role: string }) {
  const pathname = usePathname();

  return (
    <>
      <DesktopNav pathname={pathname} displayName={displayName} role={role} />
      <MobileTopBar pathname={pathname} />
      <MobileBottomNav pathname={pathname} />
    </>
  );
}

// ─── Desktop ──────────────────────────────────────────────────────────────

function DesktopNav({
  pathname,
  displayName,
  role,
}: {
  pathname: string;
  displayName: string;
  role: string;
}) {
  return (
    <header
      className="hidden md:block sticky top-0 z-30 border-b border-white/[0.08] bg-[#070a17]/75 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-1 p-1 bg-white/[0.025] border border-white/[0.08] rounded-lg">
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0 px-1.5 py-1 rounded-md hover:bg-white/[0.05] transition-colors"
          >
            <span className="brand-mark h-6 w-6 inline-block" />
            <span className="font-display font-semibold tracking-wide text-[14px]">
              Worship Hub
            </span>
          </Link>

          <nav className="flex-1 min-w-0 flex flex-wrap gap-0.5 text-sm">
            {ALL_LINKS.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  title={label}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all shrink-0",
                    active
                      ? "text-white bg-white/[0.09] ring-1 ring-white/[0.16] shadow-[0_0_18px_rgba(139,92,246,0.18)]"
                      : "text-[#8a92b4] hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <Icon className="size-3.5" strokeWidth={1.75} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-0.5 text-sm shrink-0">
            <Link
              href="/settings"
              className={cn(
                "inline-flex items-center justify-center size-8 rounded-md transition-colors",
                isActive(pathname, "/settings")
                  ? "text-white bg-white/[0.09]"
                  : "text-[#8a92b4] hover:text-white hover:bg-white/[0.05]"
              )}
              aria-label="Settings"
            >
              <SettingsIcon className="size-3.5" strokeWidth={1.75} />
            </Link>
            <span className="hidden lg:flex items-center gap-2 px-2 text-[#8a92b4]">
              <span className="text-white/90">{displayName}</span>
              <span
                className="font-mono text-[9px] tracking-[0.18em] px-1.5 py-[3px] rounded-md border border-[#00e8ff]/35 text-[#00e8ff] uppercase font-semibold"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,232,255,0.18), rgba(139,92,246,0.18))",
                }}
              >
                {roleLabel(role as Role)}
              </span>
            </span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Mobile top bar ───────────────────────────────────────────────────────
// Minimal: brand on the left, settings + sign-out on the right. Primary
// navigation lives in the bottom tab bar where the thumb actually is.

function MobileTopBar({ pathname }: { pathname: string }) {
  return (
    <header
      className="md:hidden sticky top-0 z-30 border-b border-white/[0.08] bg-[#070a17]/85 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Link
          href="/"
          className="flex items-center gap-2 group min-w-0"
          aria-label="Worship Hub home"
        >
          <span className="brand-mark h-7 w-7 inline-block shrink-0" />
          <span className="font-display font-semibold tracking-wide text-[15px] truncate">
            Worship Hub
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/settings"
            className={cn(
              "inline-flex items-center justify-center size-10 rounded-md transition-colors",
              isActive(pathname, "/settings")
                ? "text-white bg-white/[0.09]"
                : "text-[#8a92b4] hover:text-white active:bg-white/[0.05]"
            )}
            aria-label="Settings"
          >
            <SettingsIcon className="size-5" strokeWidth={1.75} />
          </Link>
          <SignOutButton compact />
        </div>
      </div>
    </header>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────
// Five thumb-reachable slots. "More" opens a sheet with secondary links.

function MobileBottomNav({ pathname }: { pathname: string }) {
  const [moreOpen, setMoreOpen] = useState(false);

  // The "More" tab is visually active whenever a secondary route is showing.
  const onSecondary = SECONDARY.some((l) => isActive(pathname, l.href));

  return (
    <>
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08] bg-[#070a17]/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5">
          {PRIMARY.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors",
                    active
                      ? "text-white"
                      : "text-[#8a92b4] active:bg-white/[0.04]"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center size-9 rounded-lg transition-all",
                      active &&
                        "bg-white/[0.09] ring-1 ring-white/[0.16] shadow-[0_0_18px_rgba(139,92,246,0.22)]"
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-[10px] font-medium tracking-wide">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-1 py-2 min-h-[56px] transition-colors",
                onSecondary
                  ? "text-white"
                  : "text-[#8a92b4] active:bg-white/[0.04]"
              )}
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              aria-label="More"
            >
              <span
                className={cn(
                  "inline-flex items-center justify-center size-9 rounded-lg transition-all",
                  onSecondary &&
                    "bg-white/[0.09] ring-1 ring-white/[0.16] shadow-[0_0_18px_rgba(139,92,246,0.22)]"
                )}
              >
                <MoreHorizontal className="size-5" strokeWidth={1.75} />
              </span>
              <span className="text-[10px] font-medium tracking-wide">More</span>
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
            <DialogDescription>Jump to anywhere in the hub.</DialogDescription>
          </DialogHeader>
          <ul className="grid grid-cols-3 gap-2">
            {SECONDARY.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-colors min-h-[80px]",
                      active
                        ? "border-white/[0.16] bg-white/[0.06] text-white"
                        : "border-white/[0.08] bg-white/[0.02] text-[#c8cee6] active:bg-white/[0.05]"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Sign out (shared) ────────────────────────────────────────────────────

function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    // Keep the dialog open during the action so the spinner is visible.
    // The redirect inside signOut() unmounts everything when it completes.
    // Buttons are disabled while pending so tapping again is harmless.
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 text-[#8a92b4] hover:text-white active:bg-white/[0.05] transition-colors rounded-md disabled:opacity-60 disabled:pointer-events-none",
          compact ? "size-10 justify-center" : "px-2 py-1 hover:bg-white/[0.05]"
        )}
        aria-label="Sign out"
      >
        {pending ? (
          <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <LogOut
            className={compact ? "size-5" : "size-3.5"}
            strokeWidth={1.75}
          />
        )}
        {!compact && (
          <span className="hidden sm:inline">
            {pending ? "Signing out…" : "Sign out"}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You&apos;ll be returned to the login screen. Your team data stays
              safe on the server.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Stay signed in
            </Button>
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={pending}
              className="gap-2"
            >
              {pending && (
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                  aria-hidden
                />
              )}
              {pending ? "Signing out…" : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
