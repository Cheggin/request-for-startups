"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  convertImage,
  getOutputFilename,
  detectFormat,
} from "@/lib/conversion-engine";
import { getImageDimensions } from "@/lib/get-image-dimensions";
import { DEFAULT_QUALITY, type ImageFormat } from "@/lib/constants";

export interface SourceImage {
  file: File;
  name: string;
  format: ImageFormat | null;
  width: number;
  height: number;
  sizeBytes: number;
  objectUrl: string;
}

export interface ConvertedImage {
  blob: Blob;
  name: string;
  format: ImageFormat;
  width: number;
  height: number;
  sizeBytes: number;
  objectUrl: string;
  quality: number;
}

type ConversionStatus = "idle" | "converting" | "done" | "error";

export function useImageConverter() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [converted, setConverted] = useState<ConvertedImage | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("png");
  const [quality, setQuality] = useState<number>(DEFAULT_QUALITY.png);
  const [status, setStatus] = useState<ConversionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Track previous object URLs for cleanup
  const prevSourceUrl = useRef<string | null>(null);
  const prevConvertedUrl = useRef<string | null>(null);

  const loadFile = useCallback(async (file: File) => {
    // Clean up previous source URL
    if (prevSourceUrl.current) {
      URL.revokeObjectURL(prevSourceUrl.current);
    }
    if (prevConvertedUrl.current) {
      URL.revokeObjectURL(prevConvertedUrl.current);
    }

    const objectUrl = URL.createObjectURL(file);
    prevSourceUrl.current = objectUrl;

    try {
      const dims = await getImageDimensions(file);
      const format = detectFormat(file);

      setSource({
        file,
        name: file.name,
        format,
        width: dims.width,
        height: dims.height,
        sizeBytes: file.size,
        objectUrl,
      });
      setConverted(null);
      setStatus("idle");
      setError(null);
    } catch {
      setError("Failed to load image");
      setStatus("error");
    }
  }, []);

  const convert = useCallback(async () => {
    if (!source) return;

    setStatus("converting");
    setError(null);

    // Clean up previous converted URL
    if (prevConvertedUrl.current) {
      URL.revokeObjectURL(prevConvertedUrl.current);
    }

    try {
      const result = await convertImage(source.file, {
        targetFormat,
        quality,
      });

      const objectUrl = URL.createObjectURL(result.blob);
      prevConvertedUrl.current = objectUrl;

      const outputName = getOutputFilename(source.name, targetFormat);

      setConverted({
        blob: result.blob,
        name: outputName,
        format: targetFormat,
        width: result.width,
        height: result.height,
        sizeBytes: result.blob.size,
        objectUrl,
        quality,
      });
      setStatus("done");
    } catch {
      setError("Conversion failed. Please try a different file or format.");
      setStatus("error");
    }
  }, [source, targetFormat, quality]);

  // Auto-convert when source or format/quality changes
  useEffect(() => {
    if (source) {
      convert();
    }
  }, [source, targetFormat, quality, convert]);

  const updateTargetFormat = useCallback(
    (format: ImageFormat) => {
      setTargetFormat(format);
      setQuality(DEFAULT_QUALITY[format]);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevSourceUrl.current) URL.revokeObjectURL(prevSourceUrl.current);
      if (prevConvertedUrl.current)
        URL.revokeObjectURL(prevConvertedUrl.current);
    };
  }, []);

  return {
    source,
    converted,
    targetFormat,
    quality,
    status,
    error,
    loadFile,
    setTargetFormat: updateTargetFormat,
    setQuality,
  };
}
