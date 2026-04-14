import { describe, it, expect } from "bun:test";
import { classifyStartupType } from "./detect-type.js";

describe("classifyStartupType", () => {
  it("detects b2c from consumer keywords", () => {
    expect(classifyStartupType("A social fitness app for tracking workouts")).toBe("b2c");
  });

  it("detects devtool from developer keywords", () => {
    expect(classifyStartupType("An API monitoring SDK for developer infrastructure")).toBe("devtool");
  });

  it("detects b2b-saas from enterprise keywords", () => {
    expect(classifyStartupType("A B2B SaaS analytics dashboard for enterprise teams")).toBe("b2b-saas");
  });

  it("detects marketplace from two-sided keywords", () => {
    expect(classifyStartupType("A marketplace connecting freelancer vendors with buyers")).toBe("marketplace");
  });

  it("detects hardware from device keywords", () => {
    expect(classifyStartupType("An IoT sensor device with embedded firmware")).toBe("hardware");
  });

  it("detects fintech from financial keywords", () => {
    expect(classifyStartupType("A fintech payment wallet for crypto transactions")).toBe("fintech");
  });

  it("detects healthcare from medical keywords", () => {
    expect(classifyStartupType("A telemedicine platform for patient doctor consultations with HIPAA compliance")).toBe("healthcare");
  });

  it("detects ecommerce from shopping keywords", () => {
    expect(classifyStartupType("An e-commerce store with product catalog, cart, and checkout")).toBe("ecommerce");
  });

  it("detects content-platform from publishing keywords", () => {
    expect(classifyStartupType("A content publishing platform with newsletter and subscriber feed")).toBe("content-platform");
  });

  it("falls back to b2c when no clear signals", () => {
    expect(classifyStartupType("a thing that does stuff")).toBe("b2c");
  });

  it("uses spec text when provided", () => {
    const idea = "a new platform";
    const spec = "This system manages API keys, webhooks, and developer SDK integrations";
    expect(classifyStartupType(idea, spec)).toBe("devtool");
  });

  it("combines idea and spec signals", () => {
    const idea = "fintech solution";
    const spec = "Handles payment processing, banking integration, and wallet management for crypto trading";
    expect(classifyStartupType(idea, spec)).toBe("fintech");
  });

  it("is case insensitive", () => {
    expect(classifyStartupType("A HEALTHCARE MEDICAL platform for PATIENT care")).toBe("healthcare");
  });
});
