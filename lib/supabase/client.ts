"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error(`Missing Supabase Environment Variables: URL is ${url ? 'set' : 'missing'}, Key is ${key ? 'set' : 'missing'}`);
  }

  return createBrowserClient(url, key, {
    cookieOptions: {
      name: "sb-esurat-auth-token",
    },
    db: {
      schema: "kemenag_surat",
    },
  });
}

