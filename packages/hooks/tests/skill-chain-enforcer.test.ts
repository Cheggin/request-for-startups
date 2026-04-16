import { describe, test, expect } from "bun:test";
import {
  evaluate,
  isPhaseComplete,
  missingFromPhase,
  matchesGate,
  findActiveFlow,
  type SkillChains,
} from "../src/skill-chain-enforcer.js";

const WEBSITE_FLOW: SkillChains = {
  flows: {
    "website-end-to-end": {
      trigger_skill: "website-end-to-end",
      gate_patterns: ["app/**", "*.tsx", "packages/*/src/**"],
      phases: [
        { name: "discovery", required: ["shape", "brand-guidelines"] },
        { name: "foundation", required: ["website-creation", "impeccable"] },
        { name: "ship", required: ["deploy-pipeline"] },
      ],
    },
  },
};

const OR_FLOW: SkillChains = {
  flows: {
    demo: {
      trigger_skill: "demo",
      gate_patterns: ["src/**"],
      phases: [
        { name: "pick", oneOf: ["a", "b"] },
        { name: "atleast-two", anyOf: { min: 2, of: ["x", "y", "z"] } },
      ],
    },
  },
};

describe("phase completion", () => {
  test("required — all must fire", () => {
    const p = { name: "p", required: ["a", "b"] };
    expect(isPhaseComplete(p, new Set(["a"]))).toBe(false);
    expect(isPhaseComplete(p, new Set(["a", "b"]))).toBe(true);
  });

  test("oneOf — one is enough", () => {
    const p = { name: "p", oneOf: ["a", "b"] };
    expect(isPhaseComplete(p, new Set([]))).toBe(false);
    expect(isPhaseComplete(p, new Set(["b"]))).toBe(true);
  });

  test("anyOf — min count", () => {
    const p = { name: "p", anyOf: { min: 2, of: ["x", "y", "z"] } };
    expect(isPhaseComplete(p, new Set(["x"]))).toBe(false);
    expect(isPhaseComplete(p, new Set(["x", "z"]))).toBe(true);
  });

  test("missingFromPhase for required", () => {
    const p = { name: "p", required: ["a", "b", "c"] };
    expect(missingFromPhase(p, new Set(["a"]))).toEqual(["b", "c"]);
  });

  test("missingFromPhase for oneOf when already satisfied", () => {
    const p = { name: "p", oneOf: ["a", "b"] };
    expect(missingFromPhase(p, new Set(["a"]))).toEqual([]);
  });
});

describe("gate pattern matching", () => {
  test("matches deep glob", () => {
    expect(matchesGate("app/page.tsx", ["app/**"])).toBe(true);
    expect(matchesGate("app/nested/deep/file.ts", ["app/**"])).toBe(true);
  });

  test("matches single-segment wildcard", () => {
    expect(matchesGate("packages/cli/src/x.ts", ["packages/*/src/**"])).toBe(true);
    expect(matchesGate("packages/a/b/src/x.ts", ["packages/*/src/**"])).toBe(false);
  });

  test("matches file extension", () => {
    expect(matchesGate("foo.tsx", ["*.tsx"])).toBe(true);
    expect(matchesGate("foo.ts", ["*.tsx"])).toBe(false);
  });

  test("no match returns false", () => {
    expect(matchesGate("README.md", ["app/**", "*.tsx"])).toBe(false);
  });
});

describe("findActiveFlow", () => {
  test("no trigger fired — no active flow", () => {
    expect(findActiveFlow(WEBSITE_FLOW, ["shape", "impeccable"])).toBeNull();
  });

  test("trigger fired — flow is active", () => {
    const active = findActiveFlow(WEBSITE_FLOW, ["website-end-to-end", "shape"]);
    expect(active?.name).toBe("website-end-to-end");
  });
});

describe("evaluate — website-end-to-end", () => {
  test("no flow active — allow any edit", () => {
    const r = evaluate(WEBSITE_FLOW, "app/page.tsx", []);
    expect(r.decision).toBe("ALLOW");
  });

  test("flow active but edit outside gate — allow", () => {
    const r = evaluate(WEBSITE_FLOW, "README.md", ["website-end-to-end"]);
    expect(r.decision).toBe("ALLOW");
  });

  test("flow active, no phase skill fired — deny", () => {
    const r = evaluate(WEBSITE_FLOW, "app/page.tsx", ["website-end-to-end"]);
    expect(r.decision).toBe("DENY");
    expect(r.message).toContain("discovery");
    expect(r.message).toContain("shape");
  });

  test("flow active, last skill not in any phase — deny", () => {
    const r = evaluate(WEBSITE_FLOW, "app/page.tsx", [
      "website-end-to-end",
      "audit",
    ]);
    // audit is not in WEBSITE_FLOW (test flow only has 3 phases, no audit)
    expect(r.decision).toBe("DENY");
  });

  test("discovery partly done, edit during discovery — deny with missing", () => {
    const r = evaluate(WEBSITE_FLOW, "app/page.tsx", [
      "website-end-to-end",
      "shape",
      "website-creation",
    ]);
    expect(r.decision).toBe("DENY");
    expect(r.message).toContain("discovery");
    expect(r.message).toContain("brand-guidelines");
  });

  test("discovery complete, edit during foundation — allow", () => {
    const r = evaluate(WEBSITE_FLOW, "app/page.tsx", [
      "website-end-to-end",
      "shape",
      "brand-guidelines",
      "website-creation",
    ]);
    expect(r.decision).toBe("ALLOW");
  });

  test("skipping phases — deny", () => {
    const r = evaluate(WEBSITE_FLOW, "app/page.tsx", [
      "website-end-to-end",
      "deploy-pipeline",
    ]);
    expect(r.decision).toBe("DENY");
    expect(r.message).toContain("discovery");
  });

  test("all phases complete — allow", () => {
    const r = evaluate(WEBSITE_FLOW, "app/page.tsx", [
      "website-end-to-end",
      "shape",
      "brand-guidelines",
      "website-creation",
      "impeccable",
      "deploy-pipeline",
    ]);
    expect(r.decision).toBe("ALLOW");
  });
});

describe("evaluate — OR semantics", () => {
  test("oneOf phase satisfied with one — allow progression", () => {
    const r = evaluate(OR_FLOW, "src/x.ts", ["demo", "a", "x", "y"]);
    expect(r.decision).toBe("ALLOW");
  });

  test("oneOf unsatisfied, later skill fired — deny with oneOf options", () => {
    const r = evaluate(OR_FLOW, "src/x.ts", ["demo", "x", "y"]);
    expect(r.decision).toBe("DENY");
    expect(r.message).toMatch(/a|b/);
  });

  test("anyOf satisfied when ≥ min fire", () => {
    const r = evaluate(OR_FLOW, "src/x.ts", ["demo", "a", "x"]);
    // x is in atleast-two phase; needs ≥2 of x,y,z before allowing edits AFTER
    // an atleast-two-phase skill. We only fired x, and we're editing during
    // atleast-two, but prior phase "pick" is complete (a fired). So we're in
    // phase 2. Phase 2 is current; no earlier to check. ALLOW.
    expect(r.decision).toBe("ALLOW");
  });
});
