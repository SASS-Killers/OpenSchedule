// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/neon", () => {
  const mockQuery = vi.fn();
  mockQuery.mockReturnValue(Promise.resolve([]));
  return { query: mockQuery, raw: vi.fn() };
});

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  bookingConfirmationClientEmail: vi.fn(() => ({ subject: "Confirmed", text: "test", html: "<p>test</p>" })),
  bookingNotificationHostEmail: vi.fn(() => ({ subject: "New booking", text: "test", html: "<p>test</p>" })),
}));

import { POST as book } from "@/pages/api/book";

// Need to check what path this actually is
describe("POST /api/book", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 without required fields", async () => {
    const req = new Request("http://localhost:6969/api/book", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const resp = await book({ request: req } as any);
    expect(resp.status).toBe(400);
  });
});
