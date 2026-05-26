import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Exclude:
    //   - Next.js internal assets (_next/static, _next/image)
    //   - common image / font extensions
    //   - service worker, manifest, robots, sitemap, favicon
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|json|webmanifest)$).*)",
  ],
};
