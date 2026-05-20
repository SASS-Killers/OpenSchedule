import type { APIRoute } from "astro";
import { query } from "@/db/neon";
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

  const rows = await query`
    SELECT id, day_of_week, start_time, end_time FROM schedules WHERE user_id = ${session.userId} ORDER BY day_of_week
  `;

  return new Response(JSON.stringify(rows), {
    headers: { "content-type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const session = await getUser(request);
  if (!session || !["admin", "host"].includes(session.role)) {
    return new Response(null, { status: 401 });
  }

  const body = await request.json();
  const entries = body as { dayOfWeek: number; startTime: string; endTime: string }[];

  await query`DELETE FROM schedules WHERE user_id = ${session.userId}`;

  for (const entry of entries) {
    await query`
      INSERT INTO schedules (id, user_id, day_of_week, start_time, end_time)
      VALUES (${crypto.randomUUID()}, ${session.userId}, ${entry.dayOfWeek}, ${entry.startTime}, ${entry.endTime})
    `;
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};
