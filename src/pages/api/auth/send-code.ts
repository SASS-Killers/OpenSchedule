import type { APIRoute } from "astro";
import { query } from "@/db/neon";
import { generateCode } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email") as string;

  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
  }

  const [user] = await query`
    SELECT id FROM users WHERE email = ${email} AND is_active = true LIMIT 1
  `;

  if (!user) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Rate limit: 60s cooldown
  const now = Math.floor(Date.now() / 1000);
  const [recent] = await query`
    SELECT id FROM verification_codes WHERE email = ${email} AND created_at > ${now - 60} LIMIT 1
  `;

  if (recent) {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  }

  // Generate code
  const code = generateCode();
  const id = crypto.randomUUID();
  const expiresAt = now + 600;

  await query`
    INSERT INTO verification_codes (id, email, code, attempts, expires_at, created_at)
    VALUES (${id}, ${email}, ${code}, 0, ${expiresAt}, ${now})
  `;

  return new Response(JSON.stringify({ ok: true, devCode: code, email }), {
    headers: { "content-type": "application/json" },
  });
};
