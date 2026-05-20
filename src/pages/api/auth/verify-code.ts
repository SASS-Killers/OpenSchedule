import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { signSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB as D1Database;
  const form = await request.formData();
  const email = form.get("email") as string;
  const code = form.get("code") as string;

  if (!email || !code) {
    return new Response(JSON.stringify({ error: "Email and code required" }), { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);

  // Find valid code
  const record = await db
    .prepare(
      "SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > ?"
    )
    .bind(email, code, now)
    .first<any>();

  if (!record) {
    return new Response(JSON.stringify({ error: "Invalid or expired code" }), { status: 401 });
  }

  if (record.attempts >= 5) {
    await db.prepare("DELETE FROM verification_codes WHERE id = ?").bind(record.id).run();
    return new Response(JSON.stringify({ error: "Too many attempts" }), { status: 429 });
  }

  // Get user
  const user = await db
    .prepare("SELECT * FROM users WHERE email = ? AND is_active = 1")
    .bind(email)
    .first<any>();

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  // Delete the code
  await db.prepare("DELETE FROM verification_codes WHERE id = ?").bind(record.id).run();

  // Sign session JWT
  const token = await signSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  // Set cookie and redirect
  return new Response(null, {
    status: 302,
    headers: {
      location: "/admin",
      "set-cookie": `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    },
  });
};
