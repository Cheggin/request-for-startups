"use client";

import { useImageConverter } from "@/hooks/use-image-converter";
import { DropZone } from "@/components/converter/drop-zone";
import { FormatPicker } from "@/components/converter/format-picker";
import { QualitySlider } from "@/components/converter/quality-slider";
import { ImagePreview } from "@/components/converter/image-preview";
import { DownloadButton } from "@/components/converter/download-button";
import { ConversionStatus } from "@/components/converter/conversion-status";
import { Card } from "@/components/ui/card";
import { formatSizeDelta } from "@/lib/format-file-size";

export default function HomePage() {
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

  const showQualitySlider = targetFormat === "jpg" || targetFormat === "webp";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      {/* Hero */}
      <div className="mb-10 text-center" data-testid="hero-section">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Convert images
          <span className="block text-primary">in your browser</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          Fast, free, and private. Your images never leave your device.
          Drop a file, pick a format, download instantly.
        </p>
      </div>

      {/* Converter Card */}
      <Card className="mb-8" data-testid="converter-card">
        <div className="flex flex-col gap-6">
          {/* Drop Zone */}
          <DropZone
            onFileAccepted={loadFile}
            loadedFileName={source?.name}
          />

          {/* Controls */}
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

          {/* Status */}
          <ConversionStatus
            status={status}
            errorMessage={error ?? undefined}
          />
        </div>
      </Card>

      {/* Preview + Download */}
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

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Convertify",
            description:
              "Convert images between PNG, JPG, and WebP instantly in your browser. No uploads, no servers — your images never leave your device.",
            url: "https://convertify.app",
            applicationCategory: "Multimedia",
            operatingSystem: "Any",
            browserRequirements:
              "Requires a modern web browser with Canvas API support",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "PNG to JPG conversion",
              "PNG to WebP conversion",
              "JPG to PNG conversion",
              "JPG to WebP conversion",
              "WebP to PNG conversion",
              "WebP to JPG conversion",
              "Adjustable quality settings",
              "Client-side processing",
            ],
          }),
        }}
      />

      {/* Trust Badges */}
      <div
        className="mt-16 grid gap-6 sm:grid-cols-3"
        data-testid="trust-badges"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            100% Private
          </h3>
          <p className="mt-1 text-xs text-muted">
            Images are processed locally. Nothing is uploaded to any server.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Lightning Fast
          </h3>
          <p className="mt-1 text-xs text-muted">
            Canvas API conversion completes in under 3 seconds for most images.
          </p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Free Forever
          </h3>
          <p className="mt-1 text-xs text-muted">
            Single-file conversion is free with no limits or sign-up required.
          </p>
        </div>
      </div>
    </div>
  );
}
