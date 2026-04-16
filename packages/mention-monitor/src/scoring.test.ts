import { describe, it, expect } from "vitest";
import { scoreMentions, suggestReplyAngle } from "./scoring.js";
import type { RawMention, ScoringConfig } from "./types.js";

const config: ScoringConfig = {
  platformWeights: { hn: 2.0, reddit: 1.5, twitter: 1.0, linkedin: 0.8 },
  recencyDecayDays: 30,
};

function makeMention(overrides: Partial<RawMention> = {}): RawMention {
  return {
    platform: "hn",
    externalId: "123",
    keyword: "startup",
    title: "Test Post",
    content: "Some content about a product",
    url: "https://example.com",
    author: "user1",
    engagement: 10,
    commentCount: 5,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("scoreMentions", () => {
  it("returns scored mentions sorted by score descending", () => {
    const mentions = [
      makeMention({ externalId: "1", engagement: 1 }),
      makeMention({ externalId: "2", engagement: 100 }),
      makeMention({ externalId: "3", engagement: 10 }),
    ];
    const scored = scoreMentions(mentions, config);
    expect(scored).toHaveLength(3);
    expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
    expect(scored[1].score).toBeGreaterThanOrEqual(scored[2].score);
  });

  it("assigns higher score to HN vs Reddit (platform weight)", () => {
    const hn = makeMention({ platform: "hn", externalId: "1", engagement: 10 });
    const reddit = makeMention({ platform: "reddit", externalId: "2", engagement: 10 });
    const [scoredHn] = scoreMentions([hn], config);
    const [scoredReddit] = scoreMentions([reddit], config);
    expect(scoredHn.score).toBeGreaterThan(scoredReddit.score);
  });

  it("classifies positive sentiment", () => {
    const mention = makeMention({ title: "This tool is amazing and excellent", content: "I love it, best thing ever" });
    const [scored] = scoreMentions([mention], config);
    expect(scored.sentiment).toBe("positive");
  });

  it("classifies negative sentiment", () => {
    const mention = makeMention({ title: "Terrible and broken", content: "Worst tool, hate it, disappointed" });
    const [scored] = scoreMentions([mention], config);
    expect(scored.sentiment).toBe("negative");
  });

  it("classifies neutral when no signals", () => {
    const mention = makeMention({ title: "A post about something", content: "Some text here" });
    const [scored] = scoreMentions([mention], config);
    expect(scored.sentiment).toBe("neutral");
  });

  it("includes dedupKey on each scored mention", () => {
    const [scored] = scoreMentions([makeMention()], config);
    expect(scored.dedupKey).toBe("hn:123");
  });
});

describe("suggestReplyAngle", () => {
  it("suggests recommendation angle when user is looking for something", () => {
    const angle = suggestReplyAngle(makeMention({ title: "Looking for a good analytics tool", content: "I need recommendations" }));
    expect(angle.toLowerCase()).toContain("recommendation");
  });

  it("suggests educational angle for how-to posts", () => {
    const angle = suggestReplyAngle(makeMention({ title: "How to set up monitoring", content: "a tutorial for beginners" }));
    expect(angle.toLowerCase()).toContain("educational");
  });

  it("suggests comparison angle for vs posts", () => {
    const angle = suggestReplyAngle(makeMention({ title: "Tool A vs Tool B comparison", content: "which alternative is better" }));
    expect(angle.toLowerCase()).toContain("comparison");
  });

  it("suggests pain point angle for frustrated users", () => {
    const angle = suggestReplyAngle(makeMention({ title: "Frustrated with current tool", content: "this problem is killing me" }));
    expect(angle.toLowerCase()).toContain("pain");
  });

  it("suggests high-discussion for threads with many comments", () => {
    const angle = suggestReplyAngle(makeMention({ commentCount: 50, title: "Generic post", content: "generic content" }));
    expect(angle.toLowerCase()).toContain("discussion");
  });
});
