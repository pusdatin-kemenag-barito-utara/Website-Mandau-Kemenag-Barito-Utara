import type { APIRoute } from "astro";

const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://surat.kemenag-baritoutara.com/sitemap.xml
`;

export const GET: APIRoute = async () => {
  return new Response(ROBOTS_TXT, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
