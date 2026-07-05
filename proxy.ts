import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow health endpoint without maintenance check (required for Coolify)
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  try {
    const pusdatinUrl = process.env.NEXT_PUBLIC_PUSDATIN_URL || "https://pusdatin.kemenag-baritoutara.go.id";
    const appId = 'e-surat-kemenag';
    
    const maintenanceRes = await fetch(`${pusdatinUrl}/api/public/apps/${appId}/status`, {
      next: { revalidate: 30 }
    });

    if (maintenanceRes.ok) {
      const data = await maintenanceRes.json();
      if (data.status === 'maintenance') {
        return new NextResponse(`
          <!DOCTYPE html>
          <html lang="id">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Sistem Sedang Pemeliharaan</title>
              <link rel="icon" href="${pusdatinUrl}/branding/kemenag.svg" type="image/svg+xml">
              <style>
                body { margin: 0; overflow: hidden; background-color: #f8fafc; }
                iframe { width: 100vw; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${pusdatinUrl}/maintenance?app=Si+Mandau" title="Maintenance"></iframe>
            </body>
          </html>
        `, {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
    }
  } catch (error) {
    console.error("[PROXY] Failed to fetch maintenance status:", error);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: "sb-esurat-auth-token",
      },
      db: {
        schema: "kemenag_surat",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    if (user && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return supabaseResponse;
  }

  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
