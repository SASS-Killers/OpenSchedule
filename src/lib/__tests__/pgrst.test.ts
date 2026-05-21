import { describe, it, expect, beforeEach } from "vitest";
import { getToken, pgrst, PGRST } from "@/lib/pgrst";

describe("pgrst", () => {
  beforeEach(() => {
    document.cookie = "";
  });

  it("PGRST is /pgrst", () => {
    expect(PGRST).toBe("/pgrst");
  });

  it("getToken returns empty with no cookie", () => {
    expect(getToken()).toBe("");
  });

  it("getToken returns token from cookie", () => {
    document.cookie = "session=my-jwt-token; path=/";
    expect(getToken()).toBe("my-jwt-token");
  });

  it("pgrst adds auth header when token exists", async () => {
    document.cookie = "session=test-token; path=/";
    // Mock fetch to capture the request
    let captured: RequestInit | undefined;
    const orig = globalThis.fetch;
    globalThis.fetch = (url: any, opts?: any) => {
      captured = opts;
      return Promise.resolve(new Response("{}", { status: 200 }));
    };
    await pgrst("/event_types");
    expect(captured?.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer test-token",
    });
    globalThis.fetch = orig;
  });
});
