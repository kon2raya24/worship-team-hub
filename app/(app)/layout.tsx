import { Nav } from "@/components/nav";
import { requireProfile } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { SongCacheSync } from "@/components/song-cache-sync";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <>
      <Nav displayName={profile.display_name} role={profile.role} />
      {/* pb-24 leaves room for the mobile bottom tab bar; md: collapses it. */}
      <main className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 pb-24 md:pb-6 flex-1 w-full fade-in">
        {children}
      </main>
      <SongCacheSync />
      <Toaster richColors closeButton />
    </>
  );
}
