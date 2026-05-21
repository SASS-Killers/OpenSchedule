// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

vi.mock("@/db/neon", () => {
  const mockQuery = vi.fn();
  mockQuery.mockReturnValue(Promise.resolve([]));
  return { query: mockQuery, raw: vi.fn() };
});

import { GET } from "@/pages/api/bookings/[bookingId]/download-ics";

describe("GET /api/bookings/:id/download-ics", () => {
  it("returns 404 when booking not found", async () => {
    const resp = await GET({ params: { bookingId: "nonexistent" } } as any);
    expect(resp.status).toBe(404);
    const text = await resp.text();
    expect(text).toBe("Not found");
  });
});
