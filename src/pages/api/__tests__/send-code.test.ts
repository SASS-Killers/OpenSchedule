// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

vi.mock("@/db/neon", () => ({ query: vi.fn(), raw: vi.fn() }));

import { POST as sendCode } from "@/pages/api/auth/send-code";

beforeAll(() => { process.env.JWT_SECRET = "test-secret"; });
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true, devCode: "123456" }), { status: 200 })
  );
});

describe("POST /api/auth/send-code", () => {
  it("returns 400 without email", async () => {
    const req = new Request("http://localhost:6969/api/auth/send-code", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const resp = await sendCode({ request: req } as any);
    expect(resp.status).toBe(400);
  });

  it("returns ok with valid email", async () => {
    const req = new Request("http://localhost:6969/api/auth/send-code", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    });
    const resp = await sendCode({ request: req } as any);
    const data = await resp.json();
    expect(data.ok).toBe(true);
  });

  it("returns devCode in dev mode", async () => {
    const req = new Request("http://localhost:6969/api/auth/send-code", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    });
    const resp = await sendCode({ request: req } as any);
    const data = await resp.json();
    expect(data.devCode).toBeTruthy();
  });
});
