import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifySession } from "@/lib/auth";

async function getUser(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return null;
  return await verifySession(match[1]);
}

export const GET: APIRoute = async ({ request }) => {
  const session = await getUser(request);
  if (!session || !["admin", "host"].includes(session.role)) return new Response(null, { status: 401 });

  const db = env.DB as D1Database;
  const rows = await db
    .prepare("SELECT id, title, slug, description, duration, buffer_before, buffer_after, minimum_notice, is_active FROM event_types WHERE user_id = ? ORDER BY duration")
    .bind(session.userId)
    .all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getUser(request);
  if (!session || !["admin", "host"].includes(session.role)) return new Response(null, { status: 401 });

  const db = env.DB as D1Database;
  const body = await request.json();

  if (body.id) {
    // Update existing
    await db
      .prepare("UPDATE event_types SET title = ?, slug = ?, description = ?, duration = ?, buffer_before = ?, buffer_after = ?, minimum_notice = ?, is_active = ? WHERE id = ? AND user_id = ?")
      .bind(body.title, body.slug, body.description ?? null, body.duration, body.bufferBefore ?? 0, body.bufferAfter ?? 0, body.minimumNotice ?? 4, body.isActive ? 1 : 0, body.id, session.userId)
      .run();
  } else {
    // Create new
    await db
      .prepare("INSERT INTO event_types (id, user_id, title, slug, description, duration, buffer_before, buffer_after, minimum_notice, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), session.userId, body.title, body.slug, body.description ?? null, body.duration, body.bufferBefore ?? 0, body.bufferAfter ?? 0, body.minimumNotice ?? 4, 1)
      .run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const session = await getUser(request);
  if (!session || !["admin", "host"].includes(session.role)) return new Response(null, { status: 401 });

  const db = env.DB as D1Database;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return new Response(JSON.stringify({ error: "id required" }), { status: 400 });

  await db.prepare("DELETE FROM event_types WHERE id = ? AND user_id = ?").bind(id, session.userId).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};
