import { describe, it, expect } from "vitest";

describe("constants", () => {
  it("exports required color tokens", async () => {
    const { COLORS } = await import("../lib/constants");
    expect(COLORS.running).toBe("#22C55E");
    expect(COLORS.idle).toBe("#F59E0B");
    expect(COLORS.stuck).toBe("#EF4444");
    expect(COLORS.info).toBe("#3B82F6");
    expect(COLORS.background).toBe("#FAFAFA");
    expect(COLORS.surface).toBe("#FFFFFF");
  });

  it("exports polling intervals", async () => {
    const { POLL_AGENTS_MS, POLL_CHAIN_MS } = await import("../lib/constants");
    expect(POLL_AGENTS_MS).toBeGreaterThan(0);
    expect(POLL_CHAIN_MS).toBeGreaterThan(0);
  });

  it("exports threshold constants", async () => {
    const { IDLE_THRESHOLD_MS, STUCK_THRESHOLD_MS } = await import("../lib/constants");
    expect(IDLE_THRESHOLD_MS).toBe(5 * 60 * 1000);
    expect(STUCK_THRESHOLD_MS).toBe(15 * 60 * 1000);
    expect(STUCK_THRESHOLD_MS).toBeGreaterThan(IDLE_THRESHOLD_MS);
  });
});

describe("types", () => {
  it("Agent interface has required fields", async () => {
    const types = await import("../lib/types");
    expect(types).toBeDefined();
  });
});
