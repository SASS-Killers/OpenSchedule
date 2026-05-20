import type { APIRoute } from "astro";
import { query } from "@/db/neon";
import { signSession } from "@/lib/auth";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = form.get("email") as string;
  const code = form.get("code") as string;

  if (!email || !code) {
    return new Response(JSON.stringify({ error: "Email and code required" }), { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);

  const [record] = await query`
    SELECT * FROM verification_codes WHERE email = ${email} AND code = ${code} AND expires_at > ${now} LIMIT 1
  `;

  if (!record) {
    return new Response(JSON.stringify({ error: "Invalid or expired code" }), { status: 401 });
  }

  if ((record as any).attempts >= 5) {
    await query`DELETE FROM verification_codes WHERE id = ${(record as any).id}`;
    return new Response(JSON.stringify({ error: "Too many attempts" }), { status: 429 });
  }

  const [user] = await query`
    SELECT * FROM users WHERE email = ${email} AND is_active = true LIMIT 1
  `;

  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  await query`DELETE FROM verification_codes WHERE id = ${(record as any).id}`;

  const u = user as any;
  const token = await signSession({
    userId: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
  });

  return new Response(null, {
    status: 302,
    headers: {
      location: "/admin",
      "set-cookie": `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    },
  });
};
