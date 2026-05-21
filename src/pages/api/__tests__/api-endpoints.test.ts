// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";
import { signSession } from "@/lib/auth";

// Mock neon db
vi.mock("@/db/neon", () => ({
  query: vi.fn(),
  raw: vi.fn(),
}));

import { POST as logout } from "@/pages/api/auth/logout";
import { POST as timezone } from "@/pages/api/host/timezone";
import { POST as createHost } from "@/pages/api/admin/create-host";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-chars-long-for-hs256!!";
  // Mock fetch for any external calls
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
});

function mockReq({ body = {}, cookies = "", method = "POST" } = {}) {
  return {
    request: new Request("http://localhost:6969/api/test", {
      method,
      headers: {
        "content-type": "application/json",
        cookie: cookies,
      },
      body: JSON.stringify(body),
    }),
  } as any;
}

describe("POST /api/auth/logout", () => {
  it("clears cookie and redirects", async () => {
    const resp = await logout(mockReq());
    expect(resp.status).toBe(302);
    expect(resp.headers.get("location")).toBe("/login");
    expect(resp.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

describe("POST /api/host/timezone", () => {
  it("returns 401 without auth", async () => {
    const resp = await timezone(mockReq({ body: { timezone: "UTC" } }));
    expect(resp.status).toBe(401);
  });
});

describe("POST /api/admin/create-host", () => {
  it("returns 401 without auth", async () => {
    const resp = await createHost(mockReq({ body: { name: "Test", email: "test@test.com" } }));
    expect(resp.status).toBe(401);
  });
});
