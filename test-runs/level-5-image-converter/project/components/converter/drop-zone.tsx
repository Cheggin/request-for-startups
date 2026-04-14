"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ACCEPT_STRING,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
  SUPPORTED_INPUT_TYPES,
} from "@/lib/constants";

type DropZoneState = "idle" | "hover" | "loaded" | "error";

interface DropZoneProps {
  onFileAccepted: (file: File) => void;
  loadedFileName?: string;
}

export function DropZone({ onFileAccepted, loadedFileName }: DropZoneProps) {
  const [state, setState] = useState<DropZoneState>(
    loadedFileName ? "loaded" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return `File too large. Max size is ${MAX_FILE_SIZE_LABEL}.`;
      }
      const isSupported = SUPPORTED_INPUT_TYPES.some(
        (t) => t === file.type
      );
      if (!isSupported) {
        return "Unsupported file type.";
      }
      return null;
    },
    []
  );

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setState("error");
        setErrorMessage(error);
        return;
      }
      setState("loaded");
      setErrorMessage(null);
      onFileAccepted(file);
    },
    [validateFile, onFileAccepted]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState("hover");
  }, []);

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setState(loadedFileName ? "loaded" : "idle");
    },
    [loadedFileName]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
      else setState(loadedFileName ? "loaded" : "idle");
    },
    [handleFile, loadedFileName]
  );

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const stateClasses: Record<DropZoneState, string> = {
    idle: "border-border bg-surface hover:border-primary hover:bg-primary-light/30",
    hover: "border-primary bg-primary-light/40 scale-[1.01]",
    loaded: "border-success bg-emerald-50/50",
    error: "border-error bg-error-light",
  };

  return (
    <div
      data-testid="drop-zone"
      role="button"
      tabIndex={0}
      className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all ${stateClasses[state]}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        className="hidden"
        onChange={handleInputChange}
        data-testid="file-input"
      />

      {state === "error" && errorMessage ? (
        <div className="text-center">
          <div className="mb-2 text-3xl">⚠</div>
          <p className="text-sm font-medium text-error" data-testid="drop-zone-error">
            {errorMessage}
          </p>
          <p className="mt-1 text-xs text-muted">Click or drop to try again</p>
        </div>
      ) : state === "loaded" && loadedFileName ? (
        <div className="text-center">
          <div className="mb-2 text-3xl">✓</div>
          <p className="text-sm font-medium text-foreground">
            {loadedFileName}
          </p>
          <p className="mt-1 text-xs text-muted">
            Drop or click to replace
          </p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-3">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className="mx-auto text-muted"
            >
              <path
                d="M24 32V16m0 0l-6 6m6-6l6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M40 30v4a4 4 0 01-4 4H12a4 4 0 01-4-4v-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">
            {state === "hover"
              ? "Drop your image here"
              : "Drag & drop an image, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted">
            PNG, JPG, WebP, SVG, GIF, BMP, TIFF — up to {MAX_FILE_SIZE_LABEL}
          </p>
        </div>
      )}
    </div>
  );
}
