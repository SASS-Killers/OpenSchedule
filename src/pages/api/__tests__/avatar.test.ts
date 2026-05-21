// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { signSession } from "@/lib/auth";

const mockRaw = vi.hoisted(() => vi.fn());
const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("@/db/neon", () => ({ query: mockQuery, raw: mockRaw }));

import { POST as avatarPost, GET as avatarGet, DELETE as avatarDelete } from "@/pages/api/avatar";

beforeAll(() => { process.env.JWT_SECRET = "test-secret-at-least-32-chars-long-for-hs256!!"; });
beforeEach(() => { mockRaw.mockReset(); mockRaw.mockResolvedValue([]); mockQuery.mockReset(); mockQuery.mockResolvedValue([]); });

const smallPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

describe("POST /api/avatar", () => {
  it("returns 401 without auth", async () => {
    const req = new Request("http://localhost:6969/api/avatar", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: smallPng }),
    });
    const resp = await avatarPost({ request: req } as any);
    expect(resp.status).toBe(401);
  });

  it("uploads avatar with valid auth", async () => {
    const token = await signSession({ userId: "u1", email: "a@b.com", name: "Test", role: "admin" });
    const req = new Request("http://localhost:6969/api/avatar", {
      method: "POST", headers: { "content-type": "application/json", cookie: `session=${token}` },
      body: JSON.stringify({ data: smallPng }),
    });
    const resp = await avatarPost({ request: req } as any);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.ok).toBe(true);
  });

  it("rejects oversized image", async () => {
    const token = await signSession({ userId: "u1", email: "a@b.com", name: "Test", role: "admin" });
    const bigData = "data:image/png;base64," + "A".repeat(14 * 1024 * 1024); // ~10.5MB decoded
    const req = new Request("http://localhost:6969/api/avatar", {
      method: "POST", headers: { "content-type": "application/json", cookie: `session=${token}` },
      body: JSON.stringify({ data: bigData }),
    });
    const resp = await avatarPost({ request: req } as any);
    expect(resp.status).toBe(413);
  });
});

describe("GET /api/avatar", () => {
  it("returns 400 without userId", async () => {
    const resp = await avatarGet({ url: new URL("http://localhost:6969/api/avatar") } as any);
    expect(resp.status).toBe(400);
  });

  it("returns 404 when no avatar stored", async () => {
    mockRaw.mockResolvedValueOnce([]);
    const resp = await avatarGet({ url: new URL("http://localhost:6969/api/avatar?userId=u1") } as any);
    expect(resp.status).toBe(404);
  });

  it("returns image when avatar exists", async () => {
    mockQuery.mockResolvedValue([{ b64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" }]);
    const resp = await avatarGet({ url: new URL("http://localhost:6969/api/avatar?userId=u1") } as any);
    expect(resp.status).toBe(200);
    expect(resp.headers.get("content-type")).toBe("image/png");
    expect(resp.headers.get("cache-control")).toContain("public");
  });
});

describe("DELETE /api/avatar", () => {
  it("returns 401 without auth", async () => {
    const req = new Request("http://localhost:6969/api/avatar", { method: "DELETE" });
    const resp = await avatarDelete({ request: req } as any);
    expect(resp.status).toBe(401);
  });

  it("deletes with valid auth", async () => {
    const token = await signSession({ userId: "u1", email: "a@b.com", name: "Test", role: "admin" });
    const req = new Request("http://localhost:6969/api/avatar", {
      method: "DELETE", headers: { cookie: `session=${token}` },
    });
    const resp = await avatarDelete({ request: req } as any);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.ok).toBe(true);
  });
});
