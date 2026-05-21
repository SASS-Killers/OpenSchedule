// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("@/db/neon", () => ({ query: mockQuery, raw: vi.fn() }));

import { POST as book } from "@/pages/api/book";

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
});

describe("POST /api/book edge cases", () => {
  const validBody = { eventTypeId: "et1", startTime: 9999999999, clientName: "Alice", clientEmail: "a@a.com" };
  const mockEventType = [
    { id: "et1", duration: 30, title: "Call", user_id: "u1", host_name: "Host", host_email: "h@h.com" },
  ];

  it("detects double-booking conflict", async () => {
    mockQuery.mockResolvedValueOnce(mockEventType).mockResolvedValueOnce([{ id: "existing" }]); // Conflict exists
    const req = new Request("http://localhost:6969/api/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const resp = await book({ request: req } as any);
    expect(resp.status).toBe(409);
    const data = await resp.json();
    expect(data.error).toContain("no longer available");
  });

  it("reuses existing client on repeat booking", async () => {
    mockQuery
      .mockResolvedValueOnce(mockEventType)
      .mockResolvedValueOnce([]) // No conflict
      .mockResolvedValueOnce([{ id: "existing-client", name: "Alice" }]) // Client exists
      .mockResolvedValueOnce([]); // Insert booking
    const req = new Request("http://localhost:6969/api/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });
    const resp = await book({ request: req } as any);
    expect(resp.ok).toBe(true);
    const data = await resp.json();
    expect(data.ok).toBe(true);
  });

  it("sends confirmation emails on booking", async () => {
    mockQuery
      .mockResolvedValueOnce(mockEventType)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const req = new Request("http://localhost:6969/api/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validBody),
    });
    await book({ request: req } as any);
    expect(globalThis.fetch).toHaveBeenCalled();
    // Should call Mailpit/Brevo for 2 emails (client + host)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
