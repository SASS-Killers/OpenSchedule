// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/db/neon", () => ({
  query: vi.fn(),
  raw: vi.fn(),
}));

import { POST as session } from "@/pages/api/auth/session";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-chars-long-for-hs256!!";
});

describe("POST /api/auth/session", () => {
  it("returns 400 without userId", async () => {
    const req = new Request("http://localhost:6969/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    });
    const resp = await session({ request: req } as any);
    expect(resp.status).toBe(400);
    const data = await resp.json();
    expect(data.error).toContain("userId");
  });

  it("returns 400 without email", async () => {
    const req = new Request("http://localhost:6969/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "u1" }),
    });
    const resp = await session({ request: req } as any);
    expect(resp.status).toBe(400);
  });

  it("sets session cookie and redirects", async () => {
    const req = new Request("http://localhost:6969/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "u1", email: "a@b.com", name: "Test", role: "admin" }),
    });
    const resp = await session({ request: req } as any);
    expect(resp.status).toBe(302);
    expect(resp.headers.get("location")).toBe("/hosts/me");
    const cookie = resp.headers.get("set-cookie") || "";
    expect(cookie).toContain("session=");
    expect(cookie).toContain("Max-Age=604800");
    expect(cookie).toContain("Path=/");
    // Should NOT be HttpOnly for client-side access
    expect(cookie).not.toContain("HttpOnly");
  });

  it("accepts form-encoded data", async () => {
    const body = new URLSearchParams({ userId: "u1", email: "a@b.com", name: "Test", role: "host" });
    const req = new Request("http://localhost:6969/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    const resp = await session({ request: req } as any);
    expect(resp.status).toBe(302);
    expect(resp.headers.get("location")).toBe("/hosts/me");
  });

  it("adds Secure flag on HTTPS", async () => {
    const req = new Request("https://openschedule.app/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "u1", email: "a@b.com", name: "Test", role: "admin" }),
    });
    const resp = await session({ request: req } as any);
    const cookie = resp.headers.get("set-cookie") || "";
    expect(cookie).toContain("Secure");
  });

  it("includes userrole and webuser role in JWT", async () => {
    const req = new Request("http://localhost:6969/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: "u1", email: "a@b.com", name: "Test", role: "admin" }),
    });
    const resp = await session({ request: req } as any);
    const cookie = resp.headers.get("set-cookie") || "";
    const jwt = cookie.match(/session=([^;]+)/)?.[1] || "";
    const parts = jwt.split(".");
    const payload = JSON.parse(atob(parts[1]));
    expect(payload.role).toBe("webuser");
    expect(payload.userrole).toBe("admin");
    expect(payload.email).toBe("a@b.com");
  });
});
