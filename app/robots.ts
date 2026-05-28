import type { MetadataRoute } from "next";

const SITE_URL = "https://worship-team-hub.vercel.app";

export default function robots(): MetadataRoute.Robots {
  // The app is login-gated: every route except the public ones below
  // redirects unauthenticated visitors to /login, so there's nothing for
  // crawlers to index there. Point them at the public pages + sitemap.
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
      disallow: [
        "/songs",
        "/setlists",
        "/schedule",
        "/team",
        "/devotions",
        "/prayer",
        "/announcements",
        "/files",
        "/games",
        "/settings",
        "/share",
        "/auth",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
