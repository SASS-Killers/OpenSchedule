import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { query } from "@/db/neon";

export const POST: APIRoute = async ({ request }) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const session = match ? await verifySession(match[1]) : null;
  if (!session || !["admin", "host"].includes(session.role)) {
    return new Response(null, { status: 401 });
  }

  const form = await request.formData();
  const tz = form.get("timezone") as string;

  if (!tz) {
    return new Response(JSON.stringify({ error: "timezone required" }), { status: 400 });
  }

  await query`UPDATE users SET timezone = ${tz} WHERE id = ${session.userId}`;

  return new Response(null, {
    status: 302,
    headers: { location: "/hosts/me" },
  });
};
