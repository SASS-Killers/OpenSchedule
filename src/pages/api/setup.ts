import type { APIRoute } from "astro";
import { query } from "@/db/neon";

export const GET: APIRoute = async () => {
  await query`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'host',
      timezone TEXT NOT NULL DEFAULT 'UTC',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at INTEGER NOT NULL
    )
  `;

  await query`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `;

  await query`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    )
  `;

  await query`
    CREATE TABLE IF NOT EXISTS event_types (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL,
      buffer_before INTEGER NOT NULL DEFAULT 0,
      buffer_after INTEGER NOT NULL DEFAULT 0,
      minimum_notice INTEGER NOT NULL DEFAULT 4,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `;

  const [existing] = await query`SELECT id FROM users WHERE email = 'augmentedmike@gmail.com' LIMIT 1`;

  if (!existing) {
    await query`
      INSERT INTO users (id, email, name, slug, role, timezone, is_active, created_at)
      VALUES (${crypto.randomUUID()}, 'augmentedmike@gmail.com', 'Michael ONeal', ${crypto.randomUUID().replace(/-/g, '')}, 'admin', 'America/New_York', true, ${Math.floor(Date.now() / 1000)})
    `;
  }

  return new Response(JSON.stringify({ ok: true, adminSeeded: !existing }), {
    headers: { "content-type": "application/json" },
  });
};
