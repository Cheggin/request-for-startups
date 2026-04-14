import { FORMAT_MIME_TYPES, type ImageFormat } from "./constants";

export interface ConversionOptions {
  targetFormat: ImageFormat;
  quality: number;
}

export interface ConversionResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Converts an image file to the target format using the Canvas API.
 * Runs entirely client-side — no data leaves the browser.
 */
export async function convertImage(
  file: File,
  options: ConversionOptions
): Promise<ConversionResult> {
  const { targetFormat, quality } = options;
  const mimeType = FORMAT_MIME_TYPES[targetFormat];

  const imageBitmap = await createImageBitmap(file);
  const { width, height } = imageBitmap;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not available");
  }

  // JPG doesn't support alpha — fill with white background
  if (targetFormat === "jpg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(imageBitmap, 0, 0);
  imageBitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob returned null"));
      },
      mimeType,
      targetFormat === "png" ? undefined : quality
    );
  });

  return { blob, width, height };
}

/**
 * Generates the output filename from the original name and target format.
 */
export function getOutputFilename(
  originalName: string,
  targetFormat: ImageFormat
): string {
  const baseName = originalName.replace(/\.[^.]+$/, "");
  const ext = targetFormat === "jpg" ? "jpg" : targetFormat;
  return `${baseName}.${ext}`;
}

/**
 * Triggers a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Detects the format of a file from its MIME type.
 */
export function detectFormat(file: File): ImageFormat | null {
  const type = file.type;
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  return null;
}
