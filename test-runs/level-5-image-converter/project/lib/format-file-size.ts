const UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const decimals = unitIndex === 0 ? 0 : size >= 100 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(decimals)} ${UNITS[unitIndex]}`;
}

export function formatSizeDelta(
  inputBytes: number,
  outputBytes: number
): string {
  if (inputBytes === 0) return "+0%";
  const delta = ((outputBytes - inputBytes) / inputBytes) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)}%`;
}
