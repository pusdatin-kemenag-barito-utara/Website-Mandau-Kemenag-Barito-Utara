import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://surat.kemenag-baritoutara.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/manifest.json", "/sw.js"],
        disallow: ["/api/", "/admin/", "/_next/", "/private/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/login", "/manifest.json"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
