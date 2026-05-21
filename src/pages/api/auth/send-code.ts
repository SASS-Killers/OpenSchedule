import type { APIRoute } from "astro";
import { query } from "@/db/neon";
import { sendEmail, otpEmail } from "@/lib/email";

export const POST: APIRoute = async ({ request }) => {
  // Accept both form-encoded and JSON
  let email: string;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await request.json();
    email = body.email;
  } else {
    const form = await request.formData();
    email = form.get("email") as string;
  }

  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
  }

  // 60-second resend throttle
  const sixtySecondsAgo = Math.floor(Date.now() / 1000) - 60;
  const [recent] = await query`
    SELECT id FROM verification_codes
    WHERE email = ${email} AND created_at > ${sixtySecondsAgo}
    LIMIT 1
  ` as any[];
  if (recent) {
    return new Response(JSON.stringify({ error: "Please wait 60 seconds before requesting a new code" }), { status: 429 });
  }

  // Call PostgREST to generate and store the code
  const pgrstRes = await fetch("http://127.0.0.1:6970/rpc/send_code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_email: email }),
  });
  const pgrstData = await pgrstRes.json();

  // Send the code via email (Mailpit in dev, Brevo in prod)
  if (pgrstData.devCode) {
    const { subject, text, html } = otpEmail(pgrstData.devCode);
    await sendEmail({ to: email, emailType: "otp", subject, text, html });
  }

  // In dev, return the code so the screen can show it too
  // In prod, never return the code
  const isDev = process.env.NODE_ENV !== "production";
  return new Response(JSON.stringify({ ok: true, ...(isDev ? { devCode: pgrstData.devCode } : {}) }), {
    headers: { "content-type": "application/json" },
  });
};
