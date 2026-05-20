import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const sql = neon(url);
const schema = readFileSync(resolve("src/db/schema.sql"), "utf8");

// Run raw DDL via tagged template
const exec = (s: string) => {
  const arr = Object.assign([s], { raw: [s] }) as TemplateStringsArray;
  return sql(arr);
};

const stmts = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

let ok = 0, fail = 0;
for (const stmt of stmts) {
  try {
    await exec(stmt);
    console.log(`  ✓ ${stmt.split('\n')[0].trim()}`);
    ok++;
  } catch (e: any) {
    const msg = e.message || "";
    if (msg.includes("already exists")) {
      console.log(`  ~ ${stmt.split('\n')[0].trim()} (exists)`);
      ok++;
    } else {
      console.error(`  ✗ ${stmt.split('\n')[0].trim()}`);
      console.error(`    ${msg.split('\n')[0]}`);
      fail++;
    }
  }
}

// Seed admin
const [existing] = await sql`SELECT id FROM users WHERE email = 'augmentedmike@gmail.com' LIMIT 1`;
if (!existing) {
  const id = crypto.randomUUID();
  const slug = crypto.randomUUID().replace(/-/g, "");
  const now = Math.floor(Date.now() / 1000);
  await sql.query(
    "INSERT INTO users (id, email, name, slug, role, timezone, is_active, created_at) VALUES ($1, $2, $3, $4, 'admin', 'America/New_York', true, $5)",
    [id, "augmentedmike@gmail.com", "Michael ONeal", slug, now]
  );
  console.log("  ✓ Seeded admin user");
} else {
  console.log("  ~ Admin user already exists");
}

const [me] = await sql`SELECT email, slug, role FROM users WHERE email = 'augmentedmike@gmail.com' LIMIT 1`;
if (me) {
  const u = me as any;
  console.log(`\n  Admin: ${u.email} (${u.role})`);
  console.log(`  Booking URL: http://localhost:6969/${u.slug}`);
}
console.log(`\n${ok} succeeded, ${fail} failed`);
