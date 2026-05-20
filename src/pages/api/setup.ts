import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const GET: APIRoute = async () => {
  const db = env.DB as D1Database;

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
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
  `);

  // Seed admin if not exists
  const existing = await db
    .prepare("SELECT id FROM users WHERE email = ?")
    .bind("augmentedmike@gmail.com")
    .first();

  if (!existing) {
    await db
      .prepare(
        "INSERT INTO users (id, email, name, role, timezone, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        crypto.randomUUID(),
        "augmentedmike@gmail.com",
        "Michael ONeal",
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
