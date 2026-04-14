import { describe, it, expect } from "vitest";
import {
  SUPPORTED_INPUT_TYPES,
  OUTPUT_FORMATS,
  FORMAT_MIME_TYPES,
  DEFAULT_QUALITY,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/constants";

describe("constants", () => {
  it("supports expected input MIME types", () => {
    expect(SUPPORTED_INPUT_TYPES).toContain("image/png");
    expect(SUPPORTED_INPUT_TYPES).toContain("image/jpeg");
    expect(SUPPORTED_INPUT_TYPES).toContain("image/webp");
    expect(SUPPORTED_INPUT_TYPES).toContain("image/svg+xml");
    expect(SUPPORTED_INPUT_TYPES).toContain("image/gif");
    expect(SUPPORTED_INPUT_TYPES).toContain("image/bmp");
    expect(SUPPORTED_INPUT_TYPES).toContain("image/tiff");
  });

  it("has three output formats", () => {
    expect(OUTPUT_FORMATS).toEqual(["png", "jpg", "webp"]);
  });

  it("maps output formats to correct MIME types", () => {
    expect(FORMAT_MIME_TYPES.png).toBe("image/png");
    expect(FORMAT_MIME_TYPES.jpg).toBe("image/jpeg");
    expect(FORMAT_MIME_TYPES.webp).toBe("image/webp");
  });

  it("has sensible default quality values", () => {
    expect(DEFAULT_QUALITY.png).toBe(1);
    expect(DEFAULT_QUALITY.jpg).toBe(0.92);
    expect(DEFAULT_QUALITY.webp).toBe(0.8);
  });

  it("max file size is 50 MB", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024);
  });
});
