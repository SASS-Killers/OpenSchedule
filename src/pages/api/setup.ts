import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async () => {
  const db = env.DB as D1Database;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'host',
      timezone TEXT NOT NULL DEFAULT 'UTC',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    );

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
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Seed admin if not exists
  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind("augmentedmike@gmail.com")
    .first();

  if (!existing) {
    const userId = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO users (id, email, name, slug, role, timezone, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        userId,
        "augmentedmike@gmail.com",
        "Michael ONeal",
        crypto.randomUUID().replace(/-/g, ""),
        "admin",
        "America/New_York",
        1,
        Math.floor(Date.now() / 1000),
      )
      .run();
  }

  return new Response(JSON.stringify({ ok: true, adminSeeded: !existing }), {
    headers: { "content-type": "application/json" },
  });
};
