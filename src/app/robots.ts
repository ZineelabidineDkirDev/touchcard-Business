import type { MetadataRoute } from "next";

const siteUrl = "https://touchcard-zayn-dk.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/login",
        "/register",
        "/demande",
        "/forgot-password",
        "/reset-password/",
        "/setup-password",
        "/account-pending",
        "/auth/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
