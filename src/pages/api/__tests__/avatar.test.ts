// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";

const mockRaw = vi.hoisted(() => vi.fn());
vi.mock("@/db/neon", () => ({ query: vi.fn(), raw: mockRaw }));

import { POST as avatarPost, GET as avatarGet, DELETE as avatarDelete } from "@/pages/api/avatar";

beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });

describe("POST /api/avatar", () => {
  it("returns 401 without auth", async () => {
    const req = new Request("http://localhost:6969/api/avatar", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: "data:image/png;base64,iVBOR" }),
    });
    const resp = await avatarPost({ request: req } as any);
    expect(resp.status).toBe(401);
  });
});

describe("GET /api/avatar", () => {
  it("returns 400 without userId", async () => {
    const resp = await avatarGet({ url: new URL("http://localhost:6969/api/avatar") } as any);
    expect(resp.status).toBe(400);
  });

  it("returns 404 for unknown user", async () => {
    const resp = await avatarGet({ url: new URL("http://localhost:6969/api/avatar?userId=bad") } as any);
    expect(resp.status).toBe(404);
  });
});

describe("DELETE /api/avatar", () => {
  it("returns 401 without auth", async () => {
    const req = new Request("http://localhost:6969/api/avatar", { method: "DELETE" });
    const resp = await avatarDelete({ request: req } as any);
    expect(resp.status).toBe(401);
  });
});
