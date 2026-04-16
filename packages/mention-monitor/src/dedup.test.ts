import { describe, it, expect } from "vitest";
import { dedupKey, dedup } from "./dedup.js";
import type { RawMention } from "./types.js";

function makeMention(overrides: Partial<RawMention> = {}): RawMention {
  return {
    platform: "hn",
    externalId: "123",
    keyword: "startup",
    title: "Test Post",
    content: "Some content",
    url: "https://example.com",
    author: "user1",
    engagement: 10,
    commentCount: 5,
    createdAt: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("dedupKey", () => {
  it("combines platform and externalId", () => {
    expect(dedupKey(makeMention({ platform: "reddit", externalId: "abc" }))).toBe("reddit:abc");
  });

  it("produces different keys for different platforms", () => {
    const a = dedupKey(makeMention({ platform: "hn", externalId: "1" }));
    const b = dedupKey(makeMention({ platform: "reddit", externalId: "1" }));
    expect(a).not.toBe(b);
  });
});

describe("dedup", () => {
  it("returns unique mentions unchanged", () => {
    const mentions = [
      makeMention({ externalId: "1" }),
      makeMention({ externalId: "2" }),
      makeMention({ externalId: "3" }),
    ];
    expect(dedup(mentions)).toHaveLength(3);
  });

  it("removes duplicates with same platform+externalId", () => {
    const mentions = [
      makeMention({ externalId: "1", keyword: "startup" }),
      makeMention({ externalId: "1", keyword: "saas" }),
    ];
    expect(dedup(mentions)).toHaveLength(1);
  });

  it("keeps the higher-engagement version on duplicate", () => {
    const mentions = [
      makeMention({ externalId: "1", engagement: 5, keyword: "kw1" }),
      makeMention({ externalId: "1", engagement: 50, keyword: "kw2" }),
    ];
    const result = dedup(mentions);
    expect(result[0].engagement).toBe(50);
  });

  it("merges keywords from duplicates", () => {
    const mentions = [
      makeMention({ externalId: "1", keyword: "startup" }),
      makeMention({ externalId: "1", keyword: "saas" }),
    ];
    const result = dedup(mentions);
    expect(result[0].keyword).toContain("startup");
    expect(result[0].keyword).toContain("saas");
  });

  it("does not dedup across different platforms", () => {
    const mentions = [
      makeMention({ platform: "hn", externalId: "1" }),
      makeMention({ platform: "reddit", externalId: "1" }),
    ];
    expect(dedup(mentions)).toHaveLength(2);
  });
});
