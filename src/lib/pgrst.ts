// PostgREST base URL — proxied through the Astro dev server at /pgrst
// so the browser never hits a different origin (no CORS issues).
// In dev, Astro proxies /pgrst/* -> PostgREST on port 6970.
// In prod, Cloudflare Pages proxies /pgrst/* -> PostgREST on the server.
export const PGRST = "/pgrst";

// Get the session JWT from cookie
export function getToken(): string {
  const m = document.cookie.match(/session=([^;]+)/);
  return m ? m[1] : "";
}

// Authenticated fetch to PostgREST
export function pgrst(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${PGRST}${path}`, { ...opts, headers });
}
