"use client";

import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@/lib/format-file-size";

interface ImagePreviewProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizeBytes: number;
  format: string;
  label: string;
}

export function ImagePreview({
  src,
  alt,
  width,
  height,
  sizeBytes,
  format,
  label,
}: ImagePreviewProps) {
  return (
    <div data-testid={`image-preview-${label.toLowerCase()}`} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <Badge variant="primary">{format.toUpperCase()}</Badge>
      </div>
      <div className="relative overflow-hidden rounded-lg border border-border bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block max-h-[400px] w-full object-contain"
          data-testid={`preview-img-${label.toLowerCase()}`}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted">
        <span data-testid={`preview-dimensions-${label.toLowerCase()}`}>
          {width} × {height}
        </span>
        <span data-testid={`preview-size-${label.toLowerCase()}`}>
          {formatFileSize(sizeBytes)}
        </span>
      </div>
    </div>
  );
}
