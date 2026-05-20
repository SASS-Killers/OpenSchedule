import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { query, raw } from "@/db/neon";

// POST: upload/replace avatar (authenticated)
export const POST: APIRoute = async ({ request }) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const session = match ? await verifySession(match[1]) : null;
  if (!session || !["admin", "host"].includes(session.role)) {
    return new Response(null, { status: 401 });
  }

  const body = await request.json();
  let rawData = body.data || "";

  // Strip data URL prefix
  const dataMatch = rawData.match(/^data:(image\/\w+);base64,(.+)/);
  if (dataMatch) rawData = dataMatch[2];

  const buf = Buffer.from(rawData, "base64");
  if (buf.length > 512 * 1024) {
    return new Response(JSON.stringify({ error: "Image too large (max 512KB)" }), { status: 413 });
  }

  const hex = buf.toString("hex");
  await query`UPDATE users SET avatar = decode(${hex}, 'hex') WHERE id = ${session.userId}`;

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};

// GET: serve avatar image (public, no auth)
export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("userId");
  if (!userId) return new Response(null, { status: 400 });

  const rows = await raw(
    `SELECT encode(avatar, 'base64') AS b64 FROM users WHERE id = '${userId}' AND avatar IS NOT NULL LIMIT 1`
  ) as any[];

  if (!rows || rows.length === 0) return new Response(null, { status: 404 });

  const imgBuf = Buffer.from(rows[0].b64, "base64");
  // Sniff mime from magic bytes
  let mime = "image/png";
  if (imgBuf[0] === 0xff && imgBuf[1] === 0xd8) mime = "image/jpeg";
  else if (imgBuf[0] === 0x47 && imgBuf[1] === 0x49) mime = "image/gif";
  else if (imgBuf[0] === 0x52 && imgBuf[1] === 0x49) mime = "image/webp";

  return new Response(imgBuf, {
    status: 200,
    headers: {
      "content-type": mime,
      "cache-control": "public, max-age=86400",
    },
  });
};

// DELETE: remove avatar
export const DELETE: APIRoute = async ({ request }) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/session=([^;]+)/);
  const session = match ? await verifySession(match[1]) : null;
  if (!session || !["admin", "host"].includes(session.role)) {
    return new Response(null, { status: 401 });
  }

  await query`UPDATE users SET avatar = NULL WHERE id = ${session.userId}`;
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};
