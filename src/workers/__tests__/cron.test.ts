// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@neondatabase/serverless", () => {
  const fakeNeon = () => {
    const q = async (strings: TemplateStringsArray, ...values: any[]) => [];
    return q;
  };
  return { neon: fakeNeon };
});

describe("cron worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a scheduled handler", async () => {
    const mod = await import("@/workers/cron");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default.scheduled).toBe("function");
  });

  it("scheduled handler does not throw when called", async () => {
    const mod = await import("@/workers/cron");
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = mockFetch;

    const env = {
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      BREVO_API_KEY: "brevo-test-key",
      FROM_EMAIL: "noreply@test.com",
    };

    await expect(mod.default.scheduled({} as any, env as any, { waitUntil: vi.fn() } as any)).resolves.not.toThrow();
  }, 10000);
});
