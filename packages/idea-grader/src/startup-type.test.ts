import { describe, it, expect } from "vitest";
import { detectStartupType } from "./startup-type.js";

describe("detectStartupType", () => {
  it("detects devtool from keywords", () => {
    expect(detectStartupType("An API and SDK for developers to integrate webhooks")).toBe("devtool");
  });

  it("detects b2b-saas from keywords", () => {
    expect(detectStartupType("A SaaS dashboard for enterprise team collaboration and workflow automation")).toBe("b2b-saas");
  });

  it("detects marketplace from keywords", () => {
    expect(detectStartupType("A marketplace connecting freelancer vendors with buyers through listing and booking")).toBe("marketplace");
  });

  it("detects b2c from keywords", () => {
    expect(detectStartupType("A social mobile app for personal fitness and health tracking")).toBe("b2c");
  });

  it("defaults to b2c when no keywords match", () => {
    expect(detectStartupType("something completely unrelated with no signals")).toBe("b2c");
  });

  it("picks the type with the most keyword hits", () => {
    // More b2b keywords than devtool
    expect(detectStartupType("A SaaS dashboard for enterprise team workspace collaboration analytics CRM")).toBe("b2b-saas");
  });
});
