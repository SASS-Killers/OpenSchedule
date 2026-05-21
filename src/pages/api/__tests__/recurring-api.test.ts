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

import { GET, POST } from "@/pages/api/host/exceptions/recurring/index";
import { DELETE } from "@/pages/api/host/exceptions/recurring/[id]";

describe("GET /api/host/exceptions/recurring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    const resp = await GET({ request: new Request("http://localhost:6969") } as any);
    expect(resp.status).toBe(401);
  });

  it("returns empty array when no recurring exceptions", async () => {
    const req = new Request("http://localhost:6969/api/host/exceptions/recurring", {
      headers: { cookie: "session=valid" },
    });
    const resp = await GET({ request: req } as any);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/host/exceptions/recurring", () => {
  it("creates a recurring exception", async () => {
    const req = new Request("http://localhost:6969/api/host/exceptions/recurring", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "session=valid" },
      body: JSON.stringify({
        exceptionType: "window_block",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "11:00",
        title: "Team standup",
      }),
    });
    const resp = await POST({ request: req } as any);
    expect(resp.status).toBe(201);
    const data = await resp.json();
    expect(data.id).toBeTruthy();
  });
});

describe("DELETE /api/host/exceptions/recurring/:id", () => {
  it("returns 401 without session", async () => {
    const req = new Request("http://localhost:6969/api/host/exceptions/recurring/xyz", {
      method: "DELETE",
    });
    const resp = await DELETE({ params: { id: "xyz" }, request: req } as any);
    expect(resp.status).toBe(401);
  });
});
