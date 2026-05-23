import { Nav } from "@/components/nav";
import { requireProfile } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <>
      <Nav displayName={profile.display_name} role={profile.role} />
      <main className="mx-auto max-w-6xl px-4 py-6 flex-1 w-full fade-in">{children}</main>
      <Toaster richColors closeButton />
    </>
  );
}
