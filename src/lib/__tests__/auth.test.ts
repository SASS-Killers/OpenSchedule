// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { signSession, verifySession } from "@/lib/auth";

// jose requires a proper JWT_SECRET
beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-chars-long-for-hs256!!";
});

describe("auth", () => {
  const payload = { userId: "abc-123", email: "test@test.com", name: "Test", role: "host" as const };

  it("signs and verifies a valid JWT", async () => {
    const token = await signSession(payload);
    expect(token).toBeTruthy();
    expect(token.split(".")).toHaveLength(3);

    const decoded = await verifySession(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe("abc-123");
    expect(decoded!.email).toBe("test@test.com");
    expect(decoded!.name).toBe("Test");
    expect(decoded!.role).toBe("host");
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(payload);
    const tampered = token.slice(0, -5) + "xxxxx";
    const decoded = await verifySession(tampered);
    expect(decoded).toBeNull();
  });

  it("rejects garbage string", async () => {
    const decoded = await verifySession("not-a-jwt");
    expect(decoded).toBeNull();
  });

  it("includes userrole claim instead of role for PostgREST", async () => {
    const token = await signSession(payload);
    const parts = token.split(".");
    const decoded = JSON.parse(atob(parts[1]));
    expect(decoded.role).toBe("webuser");
    expect(decoded.userrole).toBe("host");
    expect(decoded.userId).toBe("abc-123");
  });
});
