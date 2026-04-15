import { describe, expect, test } from "bun:test";
import { deriveTmuxSessionName } from "./tmux.js";

describe("tmux session naming", () => {
  test("derives a per-project tmux session name", () => {
    expect(deriveTmuxSessionName("/Users/reagan/Documents/GitHub/request-for-startups"))
      .toBe("harness-request-for-startups");
  });

  test("collapses a harness-named root back to the shared prefix", () => {
    expect(deriveTmuxSessionName("/tmp/harness")).toBe("harness");
  });

  test("sanitizes spaces and punctuation in project names", () => {
    expect(deriveTmuxSessionName("/tmp/My Startup!")).toBe("harness-my-startup");
  });
});
