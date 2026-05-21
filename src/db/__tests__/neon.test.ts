import { describe, it, expect, vi } from "vitest";

describe("neon db module - raw function", () => {
  it("calls query with template string", async () => {
    const mockQuery = vi.fn().mockResolvedValue([{ id: 1 }]);
    vi.doMock("@neondatabase/serverless", () => ({
      neon: () => mockQuery,
    }));
    const mod = await import("@/db/neon");
    const result = await mod.raw("SELECT 1");
    expect(mockQuery).toHaveBeenCalledWith(["SELECT 1"]);
    expect(result).toEqual([{ id: 1 }]);
  });
});
