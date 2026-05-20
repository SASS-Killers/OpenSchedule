import { neon } from "@neondatabase/serverless";

// Try multiple env var sources — Astro SSR, Cloudflare bindings, process.env
function getUrl(): string {
  // @ts-ignore — Astro/Cloudflare exposes env vars differently
  const fromAstro = typeof import.meta !== "undefined" && import.meta.env?.DATABASE_URL;
  if (fromAstro) return fromAstro;
  // @ts-ignore — process.env fallback (Node/Bun)
  if (typeof process !== "undefined" && process.env?.DATABASE_URL) return process.env.DATABASE_URL;
  throw new Error("DATABASE_URL environment variable is required");
}

const url = getUrl();
export const query = neon(url);

export const raw = (s: string) => {
  const arr = Object.assign([s], { raw: [s] }) as TemplateStringsArray;
  return query(arr);
};
