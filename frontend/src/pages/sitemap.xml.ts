import type { APIRoute } from "astro";

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
        http://www.google.com/schemas/sitemap-image/1.1
        http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">
  <url>
    <loc>https://surat.kemenag-baritoutara.com/</loc>
    <lastmod>2026-08-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://surat.kemenag-baritoutara.com/mandau.png</image:loc>
      <image:title>Logo Resmi SI MANDAU E-Surat Kemenag Barito Utara</image:title>
      <image:caption>Portal Sistem Informasi Manajemen Persuratan Elektronik Kemenag Barito Utara</image:caption>
    </image:image>
  </url>
  <url>
    <loc>https://surat.kemenag-baritoutara.com/login</loc>
    <lastmod>2026-08-29</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://surat.kemenag-baritoutara.com/surat-masuk</loc>
    <lastmod>2026-08-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://surat.kemenag-baritoutara.com/surat-keluar</loc>
    <lastmod>2026-08-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://surat.kemenag-baritoutara.com/manajemen-surat</loc>
    <lastmod>2026-08-29</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

export const GET: APIRoute = async () => {
  return new Response(SITEMAP_XML, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
