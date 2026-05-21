// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/neon", () => {
  const mockQuery = vi.fn();
  mockQuery.mockReturnValue(Promise.resolve([]));
  return { query: mockQuery, raw: vi.fn() };
});

vi.mock("@/lib/auth", () => ({
  verifySession: vi.fn().mockResolvedValue({ userId: "u1", role: "host" }),
}));

import { GET, POST } from "@/pages/api/host/exceptions/index";
import { DELETE } from "@/pages/api/host/exceptions/[id]";

describe("GET /api/host/exceptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    const resp = await GET({
      url: new URL("http://localhost:6969/api/host/exceptions"),
      request: new Request("http://localhost:6969"),
    } as any);
    expect(resp.status).toBe(401);
  });

  it("returns empty array when no overrides", async () => {
    const req = new Request("http://localhost:6969/api/host/exceptions", {
      headers: { cookie: "session=valid" },
    });
    const resp = await GET({
      url: new URL("http://localhost:6969/api/host/exceptions?from=2026-01-01&to=2026-12-31"),
      request: req,
    } as any);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/host/exceptions", () => {
  it("returns 401 without session", async () => {
    const req = new Request("http://localhost:6969/api/host/exceptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const resp = await POST({ request: req } as any);
    expect(resp.status).toBe(401);
  });

  it("creates an override", async () => {
    const req = new Request("http://localhost:6969/api/host/exceptions", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=valid" },
      body: JSON.stringify({
        exceptionType: "full_day_block",
        startDate: "2026-07-01",
        endDate: "2026-07-15",
        title: "Vacation",
      }),
    });
    const resp = await POST({ request: req } as any);
    expect(resp.status).toBe(201);
    const data = await resp.json();
    expect(data.id).toBeTruthy();
  });
});

describe("DELETE /api/host/exceptions/:id", () => {
  it("returns 401 without session", async () => {
    const req = new Request("http://localhost:6969/api/host/exceptions/xyz", {
      method: "DELETE",
    });
    const resp = await DELETE({ params: { id: "xyz" }, request: req } as any);
    expect(resp.status).toBe(401);
  });
});
