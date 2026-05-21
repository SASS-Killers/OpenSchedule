// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("@/db/neon", () => ({ query: mockQuery, raw: vi.fn() }));

import { GET as slots } from "@/pages/api/slots";

describe("GET /api/slots - override support", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty for full_day_block override", async () => {
    mockQuery
      .mockResolvedValueOnce([
        { id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 0, user_id: "u1" },
      ])
      .mockResolvedValueOnce([{ timezone: "America/New_York" }])
      .mockResolvedValueOnce([{ exception_type: "full_day_block", start_time: null, end_time: null }]); // overrides
    const resp = await slots({
      url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-07-15"),
    } as any);
    const data = await resp.json();
    expect(data.slots).toEqual([]);
  });

  it("uses custom_hours override instead of schedule", async () => {
    mockQuery
      .mockResolvedValueOnce([
        { id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 0, user_id: "u1" },
      ])
      .mockResolvedValueOnce([{ timezone: "America/New_York" }])
      .mockResolvedValueOnce([{ exception_type: "custom_hours", start_time: "10:00", end_time: "12:00" }]) // overrides
      .mockResolvedValueOnce([]) // recurring
      .mockResolvedValueOnce([]) // schedules (will be skipped)
      .mockResolvedValueOnce([]); // bookings
    const resp = await slots({
      url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-07-15"),
    } as any);
    const data = await resp.json();
    // 10:00-12:00 = 2 hours = 4 slots at 30 min
    expect(data.slots.length).toBe(4);
  });

  it("carves window_block from schedule", async () => {
    mockQuery
      .mockResolvedValueOnce([
        { id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 0, user_id: "u1" },
      ])
      .mockResolvedValueOnce([{ timezone: "America/New_York" }])
      .mockResolvedValueOnce([{ exception_type: "window_block", start_time: "12:00", end_time: "13:00" }]) // window block
      .mockResolvedValueOnce([]) // recurring
      .mockResolvedValueOnce([{ start_time: "09:00", end_time: "17:00" }]) // schedule
      .mockResolvedValueOnce([]); // bookings
    const resp = await slots({
      url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-07-15"),
    } as any);
    const data = await resp.json();
    // 09:00-17:00 = 8 hours = 16 slots. Subtract 12:00-13:00 (2 slots) = 14 slots
    expect(data.slots.length).toBe(14);
  });

  it("applies recurring window_block", async () => {
    mockQuery
      .mockResolvedValueOnce([
        { id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 0, user_id: "u1" },
      ])
      .mockResolvedValueOnce([{ timezone: "America/New_York" }])
      .mockResolvedValueOnce([]) // date_overrides
      .mockResolvedValueOnce([{ exception_type: "window_block", start_time: "11:00", end_time: "12:00" }]) // recurring
      .mockResolvedValueOnce([{ start_time: "09:00", end_time: "17:00" }]) // schedule
      .mockResolvedValueOnce([]); // bookings
    const resp = await slots({
      url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-07-15"),
    } as any);
    const data = await resp.json();
    // 09:00-17:00 = 16 slots. Subtract 11:00-12:00 (2 slots) = 14 slots
    expect(data.slots.length).toBe(14);
  });

  it("applies recurring custom_hours", async () => {
    mockQuery
      .mockResolvedValueOnce([
        { id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 0, user_id: "u1" },
      ])
      .mockResolvedValueOnce([{ timezone: "America/New_York" }])
      .mockResolvedValueOnce([]) // date_overrides
      .mockResolvedValueOnce([{ exception_type: "custom_hours", start_time: "14:00", end_time: "18:00" }]) // recurring (non-overlapping with schedule)
      .mockResolvedValueOnce([{ start_time: "09:00", end_time: "12:00" }]) // schedule
      .mockResolvedValueOnce([]); // bookings
    const resp = await slots({
      url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2026-07-15"),
    } as any);
    const data = await resp.json();
    // Schedule: 09:00-12:00 (6 slots). Recurring custom: 14:00-18:00 (8 slots). No overlap, so used together = 14 slots
    expect(data.slots.length).toBe(14);
  });

  it("handles notice boundary filtering", async () => {
    // Set minimum_notice to 1 hour and use a date far in the future to ensure slots survive filtering
    mockQuery
      .mockResolvedValueOnce([
        { id: "et1", duration: 30, buffer_before: 0, buffer_after: 0, minimum_notice: 1, user_id: "u1" },
      ])
      .mockResolvedValueOnce([{ timezone: "UTC" }])
      .mockResolvedValueOnce([]) // date_overrides
      .mockResolvedValueOnce([]) // recurring
      .mockResolvedValueOnce([{ start_time: "09:00", end_time: "17:00" }]) // schedule
      .mockResolvedValueOnce([]); // bookings
    const resp = await slots({
      url: new URL("http://localhost:6969/api/slots?hostId=h1&eventTypeId=e1&date=2099-07-15"),
    } as any);
    const data = await resp.json();
    // A date in 2099 with 1 hour notice should produce slots
    expect(data.slots.length).toBeGreaterThan(0);
  });
});
