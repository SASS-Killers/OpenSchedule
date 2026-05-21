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

// GET /api/host/exceptions?from=YYYY-MM-DD&to=YYYY-MM-DD
export const GET: APIRoute = async ({ url, request }) => {
  const userId = await getUserId(request);
  if (!userId) return new Response(null, { status: 401 });

  const from = url.searchParams.get("from") || "1970-01-01";
  const to = url.searchParams.get("to") || "2099-12-31";

  const overrides = (await query`
    SELECT id, exception_type, start_date, end_date, start_time, end_time, title, is_active
    FROM date_overrides
    WHERE user_id = ${userId} AND start_date <= ${to} AND end_date >= ${from}
    ORDER BY start_date DESC
  `) as any[];

  return new Response(JSON.stringify(overrides), {
    headers: { "content-type": "application/json" },
  });
};

// POST /api/host/exceptions
export const POST: APIRoute = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) return new Response(null, { status: 401 });

  const body = await request.json();
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  await query`
    INSERT INTO date_overrides (id, user_id, start_date, end_date, exception_type, start_time, end_time, title, is_active, created_at, updated_at)
    VALUES (${id}, ${userId}, ${body.startDate}, ${body.endDate}, ${body.exceptionType}, ${body.startTime || null}, ${body.endTime || null}, ${body.title || null}, true, ${now}, ${now})
  `;

  return new Response(JSON.stringify({ id }), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};
