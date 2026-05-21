// @vitest-environment node
import { describe, it, expect, beforeAll } from "vitest";
import { signSession } from "@/lib/auth";
import { requireSession } from "@/lib/auth-guard";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-chars-long-for-hs256!!";
});

describe("auth-guard", () => {
  it("returns null with no cookie", async () => {
    const req = new Request("http://localhost:6969/admin");
    const result = await requireSession(req);
    expect(result).toBeNull();
  });

  it("returns null with invalid cookie", async () => {
    const req = new Request("http://localhost:6969/admin", {
      headers: { cookie: "session=not-a-valid-jwt" },
    });
    const result = await requireSession(req);
    expect(result).toBeNull();
  });

  it("returns null with empty cookie", async () => {
    const req = new Request("http://localhost:6969/admin", {
      headers: { cookie: "" },
    });
    const result = await requireSession(req);
    expect(result).toBeNull();
  });

  it("returns session with valid cookie", async () => {
    const token = await signSession({ userId: "u1", email: "a@b.com", name: "Test", role: "host" });
    const req = new Request("http://localhost:6969/admin", {
      headers: { cookie: `session=${token}` },
    });
    const result = await requireSession(req);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("u1");
    expect(result!.role).toBe("host");
  });
});
