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

// GET /api/host/exceptions/recurring
export const GET: APIRoute = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) return new Response(null, { status: 401 });

  const recurring = (await query`
    SELECT id, exception_type, day_of_week, start_time, end_time, title, effective_start, effective_end, is_active
    FROM recurring_exceptions
    WHERE user_id = ${userId}
    ORDER BY day_of_week
  `) as any[];

  return new Response(JSON.stringify(recurring), {
    headers: { "content-type": "application/json" },
  });
};

// POST /api/host/exceptions/recurring
export const POST: APIRoute = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) return new Response(null, { status: 401 });

  const body = await request.json();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await query`
    INSERT INTO recurring_exceptions (id, user_id, day_of_week, exception_type, start_time, end_time, title, effective_start, effective_end, is_active, created_at, updated_at)
    VALUES (${id}, ${userId}, ${body.dayOfWeek}, ${body.exceptionType}, ${body.startTime}, ${body.endTime}, ${body.title || null}, ${body.effectiveStart || null}, ${body.effectiveEnd || null}, true, ${now}, ${now})
  `;

  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
