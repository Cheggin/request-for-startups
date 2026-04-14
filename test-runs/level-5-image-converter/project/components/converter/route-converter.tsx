"use client";

import { useEffect } from "react";
import { useImageConverter } from "@/hooks/use-image-converter";
import { DropZone } from "@/components/converter/drop-zone";
import { FormatPicker } from "@/components/converter/format-picker";
import { QualitySlider } from "@/components/converter/quality-slider";
import { ImagePreview } from "@/components/converter/image-preview";
import { DownloadButton } from "@/components/converter/download-button";
import { ConversionStatus } from "@/components/converter/conversion-status";
import { Card } from "@/components/ui/card";
import { formatSizeDelta } from "@/lib/format-file-size";
import type { ImageFormat } from "@/lib/constants";

interface RouteConverterProps {
  defaultFormat: ImageFormat;
}

export function RouteConverter({ defaultFormat }: RouteConverterProps) {
  const {
    source,
    converted,
    targetFormat,
    quality,
    status,
    error,
    loadFile,
    setTargetFormat,
    setQuality,
  } = useImageConverter();

  useEffect(() => {
    setTargetFormat(defaultFormat);
  }, [defaultFormat, setTargetFormat]);

  const showQualitySlider = targetFormat === "jpg" || targetFormat === "webp";

  return (
    <div className="flex flex-col gap-6">
      <Card data-testid="converter-card">
        <div className="flex flex-col gap-6">
          <DropZone onFileAccepted={loadFile} loadedFileName={source?.name} />

          {source && (
            <div
              className="grid gap-6 sm:grid-cols-2"
              data-testid="converter-controls"
            >
              <FormatPicker
                value={targetFormat}
                onChange={setTargetFormat}
                sourceFormat={source.format}
              />
              {showQualitySlider && (
                <QualitySlider value={quality} onChange={setQuality} />
              )}
            </div>
          )}

          <ConversionStatus
            status={status}
            errorMessage={error ?? undefined}
          />
        </div>
      </Card>

      {source && (
        <div className="flex flex-col gap-6">
          <div
            className="grid gap-6 md:grid-cols-2"
            data-testid="preview-area"
          >
            <Card>
              <ImagePreview
                src={source.objectUrl}
                alt={`Original: ${source.name}`}
                width={source.width}
                height={source.height}
                sizeBytes={source.sizeBytes}
                format={source.format ?? "unknown"}
                label="Original"
              />
            </Card>

            {converted && status === "done" && (
              <Card>
                <ImagePreview
                  src={converted.objectUrl}
                  alt={`Converted: ${converted.name}`}
                  width={converted.width}
                  height={converted.height}
                  sizeBytes={converted.sizeBytes}
                  format={converted.format}
                  label="Converted"
                />
                <div className="mt-3 text-center">
                  <span
                    className="text-xs font-medium text-muted"
                    data-testid="size-delta"
                  >
                    Size change:{" "}
                    {formatSizeDelta(source.sizeBytes, converted.sizeBytes)}
                  </span>
                </div>
              </Card>
            )}
          </div>

          {converted && status === "done" && (
            <div className="flex justify-center" data-testid="download-area">
              <DownloadButton
                blob={converted.blob}
                filename={converted.name}
                sizeBytes={converted.sizeBytes}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
