import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const cfRay = request.headers.get("cf-ray");
  const isCloudflare = Boolean(cfRay);

  return new Response(
    JSON.stringify({
      status: "healthy",
      service: "SI MANDAU E-Surat Backend & Frontend",
      version: "v3.0",
      cdn: {
        provider: isCloudflare ? "Cloudflare Enterprise Edge" : "Local / Direct Access",
        http3: true,
        cf_ray: cfRay || "local",
        edge_cached: isCloudflare,
      },
      storage: {
        provider: "Cloudflare R2",
        status: "ready",
      },
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        "X-CDN-Provider": "Cloudflare",
        "Alt-Svc": 'h3=":443"; ma=86400, h3-29=":443"; ma=86400',
      },
    },
  );
};