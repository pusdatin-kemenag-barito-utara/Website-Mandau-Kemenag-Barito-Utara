import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://surat.kemenag-baritoutara.com";
  const lastMod = new Date();

  return [
    {
      url: baseUrl,
      lastModified: lastMod,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: lastMod,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
