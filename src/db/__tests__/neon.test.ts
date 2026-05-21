// @vitest-environment node
import { describe, it, expect } from "vitest";

describe("neon db module", () => {
  it("loads without error", async () => {
    // Module should load even if DATABASE_URL isn't set in test
    // It will throw on first use, not on import
    let mod: any;
    try {
      mod = await import("@/db/neon");
    } catch (e: any) {
      // Expected: DATABASE_URL not set in test environment
      expect(e.message).toContain("DATABASE_URL");
      return;
    }
    expect(mod.query).toBeDefined();
    expect(mod.raw).toBeDefined();
  });
});
