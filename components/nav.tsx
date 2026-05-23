"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  Home,
  Music,
  ListMusic,
  Calendar,
  BookOpen,
  Heart,
  Megaphone,
  Files,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/(app)/actions";

const links = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/songs", label: "Library", Icon: Music },
  { href: "/setlists", label: "Setlists", Icon: ListMusic },
  { href: "/schedule", label: "Schedule", Icon: Calendar },
  { href: "/devotions", label: "Devotions", Icon: BookOpen },
  { href: "/prayer", label: "Prayer", Icon: Heart },
  { href: "/announcements", label: "News", Icon: Megaphone },
  { href: "/files", label: "Files", Icon: Files },
];

export function Nav({ displayName, role }: { displayName: string; role: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 px-4 md:px-7 py-3 border-b border-white/[0.08] bg-[#070a17]/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <span className="brand-mark h-8 w-8 inline-block" />
          <span className="hidden sm:inline font-display font-semibold tracking-wide text-[15px]">
            Worship Hub
          </span>
        </Link>

        <nav className="flex flex-wrap gap-1 p-1 bg-white/[0.025] border border-white/[0.08] rounded-2xl text-sm">
          {links.map(({ href, label, Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all",
                  active
                    ? "text-white bg-white/[0.09] ring-1 ring-white/[0.16] shadow-[0_0_18px_rgba(139,92,246,0.18)]"
                    : "text-[#8a92b4] hover:text-white hover:bg-white/[0.05]"
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center size-8 rounded-md text-[#8a92b4] hover:text-white hover:bg-white/[0.05] transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="size-3.5" strokeWidth={1.75} />
          </Link>
          <span className="hidden md:flex items-center gap-2 text-[#8a92b4]">
            <span className="text-white/90">{displayName}</span>
            <span
              className="font-mono text-[9px] tracking-[0.18em] px-1.5 py-[3px] rounded-md border border-[#00e8ff]/35 text-[#00e8ff] uppercase font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,232,255,0.18), rgba(139,92,246,0.18))",
              }}
            >
              {role}
            </span>
          </span>
          <form action={signOut}>
            <SignOutButton />
          </form>
        </div>
      </div>
    </header>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 text-[#8a92b4] hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/[0.05] disabled:opacity-60 disabled:pointer-events-none"
      aria-label="Sign out"
    >
      {pending ? (
        <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : (
        <LogOut className="size-3.5" strokeWidth={1.75} />
      )}
      <span className="hidden sm:inline">
        {pending ? "Signing out…" : "Sign out"}
      </span>
    </button>
  );
}
