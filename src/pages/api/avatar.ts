import type { APIRoute } from "astro";
import { verifySession } from "@/lib/auth";
import { query } from "@/db/neon";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

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

  const dataMatch = rawData.match(/^data:(image\/\w+);base64,(.+)/);
  if (dataMatch) rawData = dataMatch[2];

  const imgBytes = base64ToBytes(rawData);
  if (imgBytes.length > 10 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "Image too large (max 10MB)" }), { status: 413 });
  }

  const hex = bytesToHex(imgBytes);
  await query`UPDATE users SET avatar = decode(${hex}, 'hex') WHERE id = ${session.userId}`;

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "content-type": "application/json" },
  });
};

// GET: serve avatar image (public, no auth)
export const GET: APIRoute = async ({ url }) => {
  const userId = url.searchParams.get("userId");
  if (!userId) return new Response(null, { status: 400 });

  const rows = (await query`
    SELECT encode(avatar, 'base64') AS b64 FROM users WHERE id = ${userId} AND avatar IS NOT NULL LIMIT 1
  `) as any[];

  if (!rows || rows.length === 0) return new Response(null, { status: 404 });

  const imgBytes = base64ToBytes(rows[0].b64);
  let mime = "image/png";
  if (imgBytes[0] === 0xff && imgBytes[1] === 0xd8) mime = "image/jpeg";
  else if (imgBytes[0] === 0x47 && imgBytes[1] === 0x49) mime = "image/gif";
  else if (imgBytes[0] === 0x52 && imgBytes[1] === 0x49) mime = "image/webp";

  return new Response(imgBytes, {
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
