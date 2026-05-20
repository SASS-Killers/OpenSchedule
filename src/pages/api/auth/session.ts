import type { APIRoute } from "astro";
import { signSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { userId, email, name, role } = body;

  if (!userId || !email) {
    return new Response(JSON.stringify({ error: "userId and email required" }), { status: 400 });
  }

  const token = await signSession({ userId, email, name, role: role || "host" });

  // Set the cookie via Set-Cookie header (HttpOnly works server-side)
  const isSecure = request.url.startsWith("https");
  const cookie = `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${isSecure ? "; Secure" : ""}`;

  return new Response(null, {
    status: 302,
    headers: {
      location: "/hosts/me",
      "set-cookie": cookie,
    },
  });
};
