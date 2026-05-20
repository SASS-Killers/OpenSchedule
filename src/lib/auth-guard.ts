import { verifySession, type SessionPayload } from "@/lib/auth";

export async function requireSession(request: Request): Promise<SessionPayload | null> {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;
  return await verifySession(match[1]);
}
