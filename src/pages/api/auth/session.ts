import type { APIRoute } from "astro";
import { signSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { userId, email, name, role } = body;

  if (!userId || !email) {
    return new Response(JSON.stringify({ error: "userId and email required" }), { status: 400 });
  }

  const token = await signSession({ userId, email, name, role: role || "host" });

  return new Response(JSON.stringify({ token }), {
    headers: { "content-type": "application/json" },
  });
};
