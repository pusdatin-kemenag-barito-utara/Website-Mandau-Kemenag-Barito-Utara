import type { APIRoute } from "astro";

const GO_API_BASE = process.env.GO_API_URL || "http://127.0.0.1:8080";

export const prerender = false;

export const ALL: APIRoute = async ({ request, params }) => {
  const method = request.method;
  const rawPath = typeof params.path === "string"
    ? params.path
    : Array.isArray(params.path)
      ? (params.path as string[]).join("/")
      : "";

  const cleanPath = rawPath.replace(/^\/+/, "");
  let targetPath = cleanPath;
  if (!cleanPath.startsWith("v1/") && !cleanPath.startsWith("health")) {
    targetPath = `v1/${cleanPath}`;
  }

  const url = new URL(request.url);
  const target = `${GO_API_BASE}/api/${targetPath}${url.search}`;

  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  if (cookie) headers.set("cookie", cookie);
  if (authorization) headers.set("authorization", authorization);

  let body: BodyInit | null = null;
  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      body = await request.formData();
    } else if (contentType) {
      body = await request.text();
      headers.set("content-type", contentType);
    } else {
      body = await request.text();
    }
  }

  try {
    const res = await fetch(target, { method, headers, body });
    const responseHeaders = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) responseHeaders.set("set-cookie", setCookie);
    const data = await res.arrayBuffer();
    return new Response(data, { status: res.status, headers: responseHeaders });
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Proxy Error",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
};

export const GET = ALL;
export const POST = ALL;
export const PUT = ALL;
export const DELETE = ALL;
export const PATCH = ALL;