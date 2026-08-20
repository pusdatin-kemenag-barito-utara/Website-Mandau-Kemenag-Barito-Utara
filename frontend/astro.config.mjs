import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://surat.kemenag-baritoutara.com",
  output: "server",
  adapter: node({ mode: "standalone", assets: true }),
  security: {
    checkOrigin: false,
  },
  integrations: [react()],
  vite: {
    envDir: "../",
    plugins: [tailwindcss()],
  },
});
