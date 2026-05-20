// PostgREST base URL for client-side calls
// In dev: localhost:3001. In prod: proxied through the main domain or subdomain.
export const PGRST = import.meta.env.PROD ? "/api" : "http://localhost:3001";

// Get the session JWT from cookie
export function getToken(): string {
  const m = document.cookie.match(/session=([^;]+)/);
  return m ? m[1] : "";
}

// Authenticated fetch to PostgREST
export function pgrst(path: string, opts: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${PGRST}${path}`, { ...opts, headers });
}
