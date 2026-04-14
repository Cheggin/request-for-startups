"use client";

import {
  OUTPUT_FORMATS,
  FORMAT_LABELS,
  type ImageFormat,
} from "@/lib/constants";

interface FormatPickerProps {
  value: ImageFormat;
  onChange: (format: ImageFormat) => void;
  sourceFormat?: ImageFormat | null;
}

export function FormatPicker({
  value,
  onChange,
  sourceFormat,
}: FormatPickerProps) {
  return (
    <div data-testid="format-picker" className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">
        Convert to
      </label>
      <div
        className="inline-flex rounded-lg border border-border bg-surface p-1"
        role="radiogroup"
        aria-label="Target format"
      >
        {OUTPUT_FORMATS.map((format) => {
          const isActive = value === format;
          const isSource = sourceFormat === format;

          return (
            <button
              key={format}
              role="radio"
              aria-checked={isActive}
              data-testid={`format-option-${format}`}
              className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isActive
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
              onClick={() => onChange(format)}
            >
              {FORMAT_LABELS[format]}
              {isSource && (
                <span className="ml-1.5 inline-block rounded bg-primary-light px-1 py-0.5 text-[10px] font-semibold leading-none text-primary">
                  SRC
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
