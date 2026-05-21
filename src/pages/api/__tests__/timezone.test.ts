// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";

const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("@/db/neon", () => ({ query: mockQuery, raw: vi.fn() }));

import { POST as timezone } from "@/pages/api/host/timezone";
import { signSession } from "@/lib/auth";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-chars-long-for-hs256!!";
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
});

describe("POST /api/host/timezone", () => {
  it("returns 401 without auth", async () => {
    const req = new Request("http://localhost:6969/api/host/timezone", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ timezone: "UTC" }).toString(),
    });
    const resp = await timezone({ request: req } as any);
    expect(resp.status).toBe(401);
  });

  it("updates timezone with valid auth", async () => {
    const token = await signSession({ userId: "u1", email: "a@b.com", name: "Test", role: "host" });
    const req = new Request("http://localhost:6969/api/host/timezone", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie: `session=${token}` },
      body: new URLSearchParams({ timezone: "America/Chicago" }).toString(),
    });
    const resp = await timezone({ request: req } as any);
    expect(resp.status).toBe(302);
    expect(resp.headers.get("location")).toBe("/hosts/me");
  });
});
