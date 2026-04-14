export const SUPPORTED_INPUT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/bmp",
  "image/tiff",
] as const;

export const SUPPORTED_INPUT_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".bmp",
  ".tiff",
  ".tif",
] as const;

export const OUTPUT_FORMATS = ["png", "jpg", "webp"] as const;

export type ImageFormat = (typeof OUTPUT_FORMATS)[number];

export const FORMAT_LABELS: Record<ImageFormat, string> = {
  png: "PNG",
  jpg: "JPG",
  webp: "WebP",
};

export const FORMAT_MIME_TYPES: Record<ImageFormat, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

export const DEFAULT_QUALITY: Record<ImageFormat, number> = {
  png: 1,
  jpg: 0.92,
  webp: 0.8,
};

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_FILE_SIZE_LABEL = "50 MB";

export const ACCEPT_STRING = SUPPORTED_INPUT_TYPES.join(",");
