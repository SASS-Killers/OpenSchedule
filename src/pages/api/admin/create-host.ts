import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { sendEmail, welcomeHostEmail } from "@/lib/email";

export const POST: APIRoute = async ({ request }) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const session = match ? await verifySession(match[1]) : null;
  if (!session || session.role !== "admin") return new Response(null, { status: 401 });

  const { name, email, timezone } = await request.json();

  // Create user via PostgREST
  const jwt = match![1];
  const pgrstRes = await fetch("http://127.0.0.1:6970/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ name, email, timezone, role: "host", is_active: true }),
  });

  if (!pgrstRes.ok && pgrstRes.status !== 201) {
    return new Response(JSON.stringify({ error: "Failed to create host" }), { status: 500 });
  }

  // Send welcome email
  const { subject, text, html } = welcomeHostEmail({ name, email });
  await sendEmail({ to: email, emailType: "confirmation", subject, text, html });

  return new Response(null, {
    status: 302,
    headers: { location: "/admin" },
  });
};
