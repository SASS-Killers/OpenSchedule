// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/db/neon", () => ({ query: vi.fn(), raw: vi.fn() }));

import { POST as createHost } from "@/pages/api/admin/create-host";
import { signSession } from "@/lib/auth";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-chars-long-for-hs256!!";
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
});

describe("POST /api/admin/create-host", () => {
  it("returns 401 without auth", async () => {
    const req = new Request("http://localhost:6969/api/admin/create-host", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Test", email: "t@t.com" }),
    });
    const resp = await createHost({ request: req } as any);
    expect(resp.status).toBe(401);
  });

  it("returns 401 with non-admin role", async () => {
    const token = await signSession({ userId: "u1", email: "h@h.com", name: "Host", role: "host" });
    const req = new Request("http://localhost:6969/api/admin/create-host", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `session=${token}` },
      body: JSON.stringify({ name: "Test", email: "t@t.com" }),
    });
    const resp = await createHost({ request: req } as any);
    expect(resp.status).toBe(401);
  });

  it("creates host with admin role", async () => {
    const token = await signSession({ userId: "u1", email: "a@a.com", name: "Admin", role: "admin" });
    const req = new Request("http://localhost:6969/api/admin/create-host", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `session=${token}` },
      body: JSON.stringify({ name: "New Host", email: "new@host.com", timezone: "America/Chicago" }),
    });
    const resp = await createHost({ request: req } as any);
    // Should redirect to /admin on success
    expect(resp.status).toBe(302);
    expect(resp.headers.get("location")).toBe("/admin");
  });

  it("returns 500 when PostgREST fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 500 }));
    const token = await signSession({ userId: "u1", email: "a@a.com", name: "Admin", role: "admin" });
    const req = new Request("http://localhost:6969/api/admin/create-host", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: `session=${token}` },
      body: JSON.stringify({ name: "Fail", email: "fail@test.com" }),
    });
    const resp = await createHost({ request: req } as any);
    expect(resp.status).toBe(500);
  });
});
