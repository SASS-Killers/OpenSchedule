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
  if (!session || !["admin", "host"].includes(session.role)) {
    return new Response(null, { status: 401 });
  }

  const db = env.DB as D1Database;
  const rows = await db
    .prepare("SELECT id, day_of_week, start_time, end_time FROM schedules WHERE user_id = ? ORDER BY day_of_week")
    .bind(session.userId)
    .all();

  return new Response(JSON.stringify(rows.results), {
    headers: { "content-type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const session = await getUser(request);
  if (!session || !["admin", "host"].includes(session.role)) {
    return new Response(null, { status: 401 });
  }

  const db = env.DB as D1Database;
  const body = await request.json();
  const entries = body as { dayOfWeek: number; startTime: string; endTime: string }[];

  // Replace all schedules for this user in a transaction-like sequence
  await db.prepare("DELETE FROM schedules WHERE user_id = ?").bind(session.userId).run();

  for (const entry of entries) {
    await db
      .prepare("INSERT INTO schedules (id, user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), session.userId, entry.dayOfWeek, entry.startTime, entry.endTime)
      .run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};
