import { describe, it, expect } from "vitest";
import { formatFileSize, formatSizeDelta } from "@/lib/format-file-size";

describe("formatFileSize", () => {
  it("returns '0 B' for 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes correctly", () => {
    expect(formatFileSize(1024)).toBe("1.00 KB");
    expect(formatFileSize(1536)).toBe("1.50 KB");
  });

  it("formats megabytes correctly", () => {
    expect(formatFileSize(1048576)).toBe("1.00 MB");
    expect(formatFileSize(1258291)).toBe("1.20 MB");
  });

  it("formats large megabytes without unnecessary decimals", () => {
    expect(formatFileSize(104857600)).toBe("100 MB");
  });

  it("formats gigabytes correctly", () => {
    expect(formatFileSize(1073741824)).toBe("1.00 GB");
  });
});

describe("formatSizeDelta", () => {
  it("shows positive delta with +", () => {
    expect(formatSizeDelta(100, 150)).toBe("+50%");
  });

  it("shows negative delta with -", () => {
    expect(formatSizeDelta(100, 50)).toBe("-50%");
  });

  it("shows zero delta", () => {
    expect(formatSizeDelta(100, 100)).toBe("+0%");
  });

  it("handles zero input", () => {
    expect(formatSizeDelta(0, 100)).toBe("+0%");
  });
});
