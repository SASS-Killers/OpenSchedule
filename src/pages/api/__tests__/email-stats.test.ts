// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db/neon", () => {
  const mockQuery = vi.fn();
  mockQuery.mockReturnValue(Promise.resolve([]));
  return { query: mockQuery, raw: vi.fn() };
});

import { GET, POST } from "@/pages/api/admin/email-stats";

function makeSessionCookie(userId = "admin-1", role = "admin") {
  const payload = { userId, role, email: "admin@test.com", name: "Admin" };
  // Simple base64 encoding since we can't use jose easily in tests
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `session=${encoded}.sig.dummy`;
}

describe("GET /api/admin/email-stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without session", async () => {
    const resp = await GET({ request: new Request("http://localhost:6969/api/admin/email-stats") } as any);
    expect(resp.status).toBe(401);
  });

  it("returns 401 for non-admin role", async () => {
    const req = new Request("http://localhost:6969/api/admin/email-stats", {
      headers: { cookie: makeSessionCookie("h1", "host") },
    });
    const resp = await GET({ request: req } as any);
    expect(resp.status).toBe(401);
  });
});
