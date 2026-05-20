import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { query } from "@/db/neon";

export const POST: APIRoute = async ({ request }) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const session = match ? await verifySession(match[1]) : null;
  if (!session || session.role !== "admin") {
    return new Response(null, { status: 401 });
  }

  const form = await request.formData();
  const name = form.get("name") as string;
  const email = form.get("email") as string;
  const timezone = (form.get("timezone") as string) || "UTC";

  if (!name || !email) {
    return new Response(JSON.stringify({ error: "Name and email required" }), { status: 400 });
  }

  await query`
    INSERT INTO users (id, email, name, slug, role, timezone, is_active, created_at)
    VALUES (gen_random_uuid()::TEXT, ${email}, ${name},
            encode(gen_random_uuid()::bytea, 'hex'), 'host', ${timezone}, true,
            ${Math.floor(Date.now() / 1000)})
    ON CONFLICT (email) DO NOTHING
  `;

  return new Response(null, {
    status: 302,
    headers: { location: "/admin" },
  });
};
