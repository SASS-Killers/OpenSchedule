import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB as D1Database;
  const form = await request.formData();
  const email = form.get("email") as string;

  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
  }

  // Check user exists
  const user = await db
    .prepare("SELECT id FROM users WHERE email = ? AND is_active = 1")
    .bind(email)
    .first();

  if (!user) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Rate limit: 60s cooldown
  const recent = await db
    .prepare("SELECT id FROM verification_codes WHERE email = ? AND created_at > ?")
    .bind(email, Math.floor(Date.now() / 1000) - 60)
    .first();

  if (recent) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Generate code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + 600;

  await db
    .prepare(
      "INSERT INTO verification_codes (id, email, code, attempts, expires_at, created_at) VALUES (?, ?, ?, 0, ?, ?)"
    )
    .bind(id, email, code, expiresAt, Math.floor(Date.now() / 1000))
    .run();

  // Dev mode: return code directly. Prod would send via Brevo.
  return new Response(JSON.stringify({ ok: true, devCode: code, email }), {
    headers: { "content-type": "application/json" },
  });
};
