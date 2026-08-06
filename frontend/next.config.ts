import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "pg",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    optimizePackageImports: ["lucide-react", "framer-motion", "clsx", "sonner"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
              `frame-src 'self' blob: http://localhost:8080 http://127.0.0.1:8080 https://challenges.cloudflare.com ${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || ''} ${process.env.NEXT_PUBLIC_PUSDATIN_URL || ""}`,
              `connect-src 'self' http://localhost:8080 http://127.0.0.1:8080 https://challenges.cloudflare.com ${process.env.NEXT_PUBLIC_API_URL || ""} ${process.env.NEXT_PUBLIC_SUPABASE_URL || ""} ${process.env.NEXT_PUBLIC_PUSDATIN_URL || ""}`,
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // pdfjs-dist needs canvas=false alias when rendering in browser
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
