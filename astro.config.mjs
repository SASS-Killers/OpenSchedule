import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    env: {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
    },
  }),
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      proxy: {
        // Proxy PostgREST calls so the browser talks to the same origin (no CORS)
        "/pgrst": {
          target: "http://localhost:6970",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/pgrst/, ""),
        },
      },
    },
  },
});
