import { describe, it, expect } from "vitest";
import { getOutputFilename, detectFormat } from "@/lib/conversion-engine";

describe("getOutputFilename", () => {
  it("replaces extension with target format", () => {
    expect(getOutputFilename("photo.png", "jpg")).toBe("photo.jpg");
  });

  it("handles files with multiple dots", () => {
    expect(getOutputFilename("my.photo.png", "webp")).toBe("my.photo.webp");
  });

  it("works for png output", () => {
    expect(getOutputFilename("image.jpg", "png")).toBe("image.png");
  });

  it("works for webp output", () => {
    expect(getOutputFilename("image.png", "webp")).toBe("image.webp");
  });

  it("handles files without extension", () => {
    expect(getOutputFilename("image", "png")).toBe("image.png");
  });
});

describe("detectFormat", () => {
  it("detects PNG", () => {
    const file = new File([""], "test.png", { type: "image/png" });
    expect(detectFormat(file)).toBe("png");
  });

  it("detects JPEG", () => {
    const file = new File([""], "test.jpg", { type: "image/jpeg" });
    expect(detectFormat(file)).toBe("jpg");
  });

  it("detects WebP", () => {
    const file = new File([""], "test.webp", { type: "image/webp" });
    expect(detectFormat(file)).toBe("webp");
  });

  it("returns null for unsupported output format", () => {
    const file = new File([""], "test.svg", { type: "image/svg+xml" });
    expect(detectFormat(file)).toBeNull();
  });

  it("returns null for non-image types", () => {
    const file = new File([""], "test.txt", { type: "text/plain" });
    expect(detectFormat(file)).toBeNull();
  });
});
