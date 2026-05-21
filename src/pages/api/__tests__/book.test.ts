// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("@/db/neon", () => ({ query: mockQuery, raw: vi.fn() }));

import { POST as book } from "@/pages/api/book";

beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
beforeEach(() => { vi.clearAllMocks(); globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 })); });

describe("POST /api/book", () => {
  it("returns 400 without required fields", async () => {
    const req = new Request("http://localhost:6969/api/book", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const resp = await book({ request: req } as any);
    expect(resp.status).toBe(400);
  });

  it("returns 404 when event type not found", async () => {
    mockQuery.mockResolvedValueOnce([]);
    const req = new Request("http://localhost:6969/api/book", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventTypeId: "bad", startTime: 1000, clientName: "Test", clientEmail: "t@t.com" }),
    });
    const resp = await book({ request: req } as any);
    expect(resp.status).toBe(404);
  });

  it("books successfully", async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: "et1", duration: 30, title: "Call", user_id: "u1", host_name: "Host", host_email: "h@h.com" }])
      .mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    const req = new Request("http://localhost:6969/api/book", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventTypeId: "et1", startTime: 9999999999, clientName: "Alice", clientEmail: "a@a.com" }),
    });
    const resp = await book({ request: req } as any);
    const data = await resp.json();
    expect(data.ok).toBe(true);
    expect(data.cancellationUrl).toContain("/cancel/");
  });
});
