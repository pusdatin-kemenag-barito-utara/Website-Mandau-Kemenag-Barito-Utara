/// <reference types="astro/client" />

import type { AuthUser } from "@/lib/api-client";

declare global {
  namespace App {
    interface Locals {
      authToken?: string;
      user?: AuthUser | null;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
      GO_API_URL?: string;
      SUPER_ADMIN_EMAIL?: string;
      PUBLIC_PUSDATIN_URL?: string;
      PUBLIC_API_URL?: string;
      PUBLIC_TURNSTILE_SITE_KEY?: string;
      DATABASE_URL?: string;
      TURNSTILE_SECRET_KEY?: string;
    }
  }

  var process: {
    env: NodeJS.ProcessEnv;
  };
}

export {};