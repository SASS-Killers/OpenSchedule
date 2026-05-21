// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock neon BEFORE importing email to avoid DATABASE_URL error
vi.mock("@/db/neon", () => {
  const mockQuery = vi.fn();
  mockQuery.mockReturnValue(Promise.resolve([]));
  return { query: mockQuery, raw: vi.fn() };
});

// Store original env
const originalEnv = process.env.NODE_ENV;

describe("sendEmail with telemetry logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("calls fetch with Mailpit in dev mode", async () => {
    process.env.NODE_ENV = "development";
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = mockFetch;

    const { sendEmail } = await import("@/lib/email");
    await sendEmail({
      to: "test@test.com",
      subject: "Test",
      text: "Hello",
      emailType: "otp",
    });

    expect(mockFetch).toHaveBeenCalledWith("http://127.0.0.1:8025/api/v1/send", expect.any(Object));
  });

  it("calls Brevo API in production mode", async () => {
    process.env.NODE_ENV = "production";
    process.env.BREVO_API_KEY = "test-key";
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    globalThis.fetch = mockFetch;

    const { sendEmail } = await import("@/lib/email");
    await sendEmail({
      to: "test@test.com",
      subject: "Test",
      text: "Hello",
      emailType: "confirmation",
    });

    expect(mockFetch).toHaveBeenCalledWith("https://api.brevo.com/v3/smtp/email", expect.any(Object));
  });

  it("skips Brevo call when no API key in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.BREVO_API_KEY;
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    const { sendEmail } = await import("@/lib/email");
    await sendEmail({
      to: "test@test.com",
      subject: "Test",
      text: "Hello",
      emailType: "cancellation",
    });

    // Should not call Brevo
    expect(mockFetch).not.toHaveBeenCalledWith("https://api.brevo.com/v3/smtp/email", expect.any(Object));
  });
});
