import type { APIRoute } from "astro";
import { query } from "@/db/neon";
import { verifySession } from "@/lib/auth";

async function getUserId(request: Request): Promise<string | null> {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;
  const session = await verifySession(match[1]);
  return session?.userId || null;
}

// DELETE /api/host/exceptions/:id
export const DELETE: APIRoute = async ({ params, request }) => {
  const userId = await getUserId(request);
  if (!userId) return new Response(null, { status: 401 });

  const { id } = params;
  await query`DELETE FROM date_overrides WHERE id = ${id} AND user_id = ${userId}`;
  return new Response(null, { status: 204 });
};
