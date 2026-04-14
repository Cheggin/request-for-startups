"use client";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/format-file-size";
import { downloadBlob } from "@/lib/conversion-engine";

interface DownloadButtonProps {
  blob: Blob;
  filename: string;
  sizeBytes: number;
  disabled?: boolean;
}

export function DownloadButton({
  blob,
  filename,
  sizeBytes,
  disabled,
}: DownloadButtonProps) {
  const handleDownload = () => {
    downloadBlob(blob, filename);
  };

  return (
    <Button
      data-testid="download-button"
      onClick={handleDownload}
      disabled={disabled}
      className="w-full sm:w-auto"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 2v9m0 0L5 8m3 3l3-3M3 13h10" />
      </svg>
      Download {filename}
      <span className="ml-1 text-xs opacity-75">
        ({formatFileSize(sizeBytes)})
      </span>
    </Button>
  );
}
