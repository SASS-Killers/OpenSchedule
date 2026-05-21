// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("@/db/neon", () => ({ query: mockQuery, raw: vi.fn() }));

import { GET as slots } from "@/pages/api/slots";

describe("GET /api/slots", () => {
  it("returns 400 without required params", async () => {
    const resp = await slots({ url: new URL("http://localhost:6969/api/slots") } as any);
    expect(resp.status).toBe(400);
  });

  it("returns empty when event type not found", async () => {
    mockQuery.mockResolvedValueOnce([]);
    const resp = await slots({ url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-05-22") } as any);
    const data = await resp.json();
    expect(data.slots).toEqual([]);
  });

  it("returns empty when no schedule", async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 0, user_id: "u1" }])
      .mockResolvedValueOnce([{ timezone: "America/New_York" }])
      .mockResolvedValueOnce([]) // date_overrides
      .mockResolvedValueOnce([]) // recurring_exceptions
      .mockResolvedValueOnce([]); // schedules
    const resp = await slots({ url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-05-22") } as any);
    const data = await resp.json();
    expect(data.slots).toEqual([]);
  });

  it("computes slots from schedule", async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 0, user_id: "u1" }])
      .mockResolvedValueOnce([{ timezone: "America/New_York" }])
      .mockResolvedValueOnce([]) // date_overrides
      .mockResolvedValueOnce([]) // recurring_exceptions
      .mockResolvedValueOnce([{ start_time: "09:00", end_time: "17:00" }])
      .mockResolvedValueOnce([]); // bookings
    const resp = await slots({ url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-05-22") } as any);
    const data = await resp.json();
    expect(data.slots.length).toBeGreaterThan(0);
  });
});
