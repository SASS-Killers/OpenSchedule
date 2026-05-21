import type { APIRoute } from "astro";
import { query } from "@/db/neon";
import { verifySession } from "@/lib/auth";

export const GET: APIRoute = async ({ request }) => {
  // Require admin session
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const session = match ? await verifySession(match[1]) : null;
  if (!session || session.role !== "admin") return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  // Count emails sent today
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const [row] = await query`
    SELECT COUNT(*) AS sent_today FROM sent_emails_log WHERE sent_at >= ${todayStart}
  ` as any[];

  return new Response(JSON.stringify({ sentToday: row?.sent_today || 0 }), {
    headers: { "content-type": "application/json" },
  });
};
