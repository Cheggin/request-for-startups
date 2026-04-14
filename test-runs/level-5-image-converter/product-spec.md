# Product Spec: Image Converter Web App

## Overview

A fast, privacy-first image converter that runs entirely in the browser. Users drag-and-drop (or select) an image, pick a target format, and download the converted file. No server upload required for conversion. Free for single-file conversions; batch is a paid feature.

**Tech stack:** Next.js 15 (App Router), Tailwind CSS v4, Canvas API (client-side conversion), Convex (auth, history, usage tracking).

---

## Pages & Routes

| Route | Page | Auth Required | Description |
|---|---|---|---|
| `/` | Home / Converter | No | Primary conversion interface with drag-and-drop, format picker, preview, and download. |
| `/history` | Conversion History | Yes | Paginated list of past conversions with metadata. |
| `/pricing` | Pricing | No | Free vs Pro plan comparison. |
| `/login` | Auth | No | Sign-in / sign-up via OAuth. |
| `/account` | Account Settings | Yes | Plan management, usage stats, delete account. |
| `/about` | About | No | How it works, privacy explanation, tech details. |
| `/legal/privacy` | Privacy Policy | No | Static legal page. |
| `/legal/terms` | Terms of Service | No | Static legal page. |

---

## Features

### P0 — Must Ship

#### F1: Drag-and-Drop Upload

Upload a single image file via drag-and-drop or file picker.

**Acceptance Criteria:**
- [ ] User can drag an image file onto the drop zone and see a visual hover state (border change, background tint).
- [ ] User can click the drop zone to open a native file picker filtered to image types.
- [ ] Accepted input formats: PNG, JPG/JPEG, WebP, SVG, GIF (first frame), BMP, TIFF.
- [ ] Files exceeding 50 MB display an inline error: "File too large. Max size is 50 MB."
- [ ] Non-image files display an inline error: "Unsupported file type."
- [ ] After upload, a thumbnail preview of the source image renders below the drop zone.
- [ ] Upload replaces any previously loaded image (single-file mode).
- [ ] Drop zone shows distinct visual states: idle, drag-hover, loaded, error.

#### F2: Format Selection

User selects the target output format.

**Acceptance Criteria:**
- [ ] Format picker displays four options: PNG, JPG, WebP, SVG.
- [ ] Default selection is PNG.
- [ ] Current source format is visually indicated (e.g., badge on the thumbnail).
- [ ] Selecting the same format as the source is allowed (acts as re-export).
- [ ] Selecting a format auto-triggers conversion; no separate "Convert" button needed.
- [ ] Format selector is keyboard-navigable (arrow keys + Enter).

#### F3: Client-Side Conversion (Canvas API)

Convert the image entirely in the browser using the Canvas API.

**Acceptance Criteria:**
- [ ] Raster-to-raster conversion (PNG/JPG/WebP) uses `HTMLCanvasElement.toBlob()` / `toDataURL()`.
- [ ] JPG output uses a quality slider (range: 0.1–1.0, default: 0.92).
- [ ] WebP output uses a quality slider (range: 0.1–1.0, default: 0.80).
- [ ] PNG output has no quality slider (lossless).
- [ ] SVG-to-raster conversion renders the SVG onto a canvas at its intrinsic dimensions, then exports.
- [ ] SVG-to-SVG conversion passes through the original file (no canvas round-trip).
- [ ] Alpha channel is preserved for PNG/WebP output; replaced with white background for JPG output.
- [ ] Conversion completes in under 3 seconds for images up to 10 MP on a mid-range device.
- [ ] Output file byte-size differs from input when format changes (proves actual conversion, not rename).
- [ ] No image data leaves the browser at any point during conversion.

#### F4: SVG Output (Raster-to-Vector)

Export raster images as traced SVG using client-side vectorization.

**Acceptance Criteria:**
- [ ] Raster-to-SVG conversion produces a valid `.svg` file that renders in Chrome, Firefox, and Safari.
- [ ] SVG output uses `<path>` elements (traced), not an embedded `<image>` tag with a base64 blob.
- [ ] A color-threshold or detail slider controls trace fidelity.
- [ ] Conversion of a 1000x1000 px image completes in under 10 seconds.

#### F5: Download Converted File

User downloads the converted image.

**Acceptance Criteria:**
- [ ] After conversion, a "Download" button appears.
- [ ] Clicking download triggers a browser save dialog with filename `{original_name}.{target_ext}`.
- [ ] Downloaded file opens correctly in the OS default image viewer.
- [ ] File size of the converted image is displayed next to the download button (e.g., "1.2 MB").
- [ ] Download button is disabled until conversion is complete.

#### F6: Responsive Layout

The app is usable on mobile, tablet, and desktop.

**Acceptance Criteria:**
- [ ] Layout is single-column on viewports < 768px.
- [ ] Drop zone is at least 200x200px on mobile and fills available width.
- [ ] All interactive elements have minimum 44x44px tap targets.
- [ ] No horizontal scroll on any viewport from 320px to 2560px.
- [ ] Text remains readable without zooming on mobile (minimum 16px body text).
- [ ] Lighthouse accessibility score >= 90.

---

### P1 — Should Ship (Week 2–3)

#### F7: Image Preview & Comparison

Side-by-side or toggle preview of original vs. converted image with metadata.

**Acceptance Criteria:**
- [ ] Source preview shows: filename, dimensions (W x H), file size, format.
- [ ] After conversion, output preview renders alongside the source (side-by-side on desktop, stacked on mobile).
- [ ] Output metadata shows: dimensions, file size, format, size delta vs. source (e.g., "-42%").
- [ ] A slider overlay mode lets the user drag to compare left (original) / right (converted).
- [ ] Preview renders at actual pixel dimensions with a zoom control.

#### F8: Quality & Resize Controls

Adjustable quality for lossy formats and optional resize.

**Acceptance Criteria:**
- [ ] Quality slider appears only when target format is JPG or WebP.
- [ ] Slider updates the output preview and file size in real time (debounced at 300ms).
- [ ] Slider label shows current value as a percentage (e.g., "Quality: 80%").
- [ ] "Resize" toggle expands width/height inputs.
- [ ] Aspect ratio is locked by default (toggle to unlock).
- [ ] Changing width auto-calculates height (and vice versa) when locked.
- [ ] Max output dimension: 8192px per side.
- [ ] Resize applies before format conversion.

#### F9: Authentication (Convex Auth)

Sign-in flow for history, usage tracking, and future paid features.

**Acceptance Criteria:**
- [ ] OAuth providers: Google, GitHub.
- [ ] Auth state persists across page refreshes.
- [ ] Unauthenticated users can use the converter with zero friction; auth is never a gate for single-file conversion.
- [ ] Session token stored securely; no credentials in localStorage.

#### F10: Conversion History (Authenticated Users)

Server-persisted list of past conversions with metadata.

**Acceptance Criteria:**
- [ ] Each history entry shows: original filename, input format, output format, file size delta, timestamp.
- [ ] No image data is stored server-side — only metadata persists in Convex.
- [ ] History is paginated (20 items per page, cursor-based) and sorted newest-first.
- [ ] Unauthenticated users see a prompt to sign in; no empty state confusion.
- [ ] History items can be individually deleted by the owning user.

#### F11: Paste from Clipboard

Paste an image from the clipboard.

**Acceptance Criteria:**
- [ ] `Ctrl/Cmd+V` anywhere on the page captures image data from the clipboard.
- [ ] Pasted image loads into the converter identically to a drag-and-drop upload.
- [ ] If clipboard contains no image data, nothing happens (no error).

---

### P2 — Nice to Have (Backlog)

#### F12: Batch Conversion (Pro)

Convert multiple files at once. Paid feature.

**Acceptance Criteria:**
- [ ] Pro users can drop up to 20 files simultaneously.
- [ ] Progress bar shows per-file and overall completion.
- [ ] Output is a single `.zip` download.
- [ ] Free users see an upsell modal after dropping 2+ files.

#### F13: Dark Mode

Respect system color scheme preference.

**Acceptance Criteria:**
- [ ] App defaults to system preference (`prefers-color-scheme`).
- [ ] Manual toggle in the header overrides system preference.
- [ ] Preference persists via `localStorage`.
- [ ] All UI elements maintain WCAG AA contrast ratios in both modes.

#### F14: HEIC/AVIF Support

Expand format support for modern camera and web formats.

**Acceptance Criteria:**
- [ ] HEIC files from iPhone cameras are accepted as input.
- [ ] AVIF is available as both input and output format.
- [ ] Conversion quality is comparable to Squoosh for the same input.

#### F15: Shareable Conversion Link

Generate a short-lived link to the converted file.

**Acceptance Criteria:**
- [ ] Link expires after 24 hours.
- [ ] Converted file is stored temporarily in Convex file storage.
- [ ] Link shows a preview page with a download button.
- [ ] Download count is tracked per link.

#### F16: API Access (Pro)

REST API for programmatic conversion.

**Acceptance Criteria:**
- [ ] API key management in account settings.
- [ ] `POST /api/convert` endpoint with multipart upload, returns converted file.
- [ ] Rate-limited to 100 requests/hour per key.

---

## Convex Data Models

### `users`

| Field | Type | Description |
|---|---|---|
| `_id` | `Id<"users">` | Auto-generated. |
| `externalId` | `string` | OAuth provider user ID. |
| `email` | `string` | User email address. |
| `name` | `string` | Display name. |
| `avatarUrl` | `string \| undefined` | Profile image URL from OAuth. |
| `plan` | `"free" \| "pro"` | Current subscription tier. |
| `createdAt` | `number` | Unix timestamp (ms). |

**Indexes:**
- `by_externalId` on `externalId`
- `by_email` on `email`

---

### `conversions`

| Field | Type | Description |
|---|---|---|
| `_id` | `Id<"conversions">` | Auto-generated. |
| `userId` | `Id<"users">` | Foreign key to users table. |
| `originalFilename` | `string` | e.g., `photo.heic` |
| `inputFormat` | `string` | MIME type, e.g., `image/png` |
| `outputFormat` | `string` | MIME type, e.g., `image/webp` |
| `inputSizeBytes` | `number` | Original file size. |
| `outputSizeBytes` | `number` | Converted file size. |
| `widthPx` | `number` | Output width in pixels. |
| `heightPx` | `number` | Output height in pixels. |
| `quality` | `number \| undefined` | Quality setting used (undefined for PNG/SVG). |
| `createdAt` | `number` | Unix timestamp (ms). |

**Indexes:**
- `by_userId` on `userId`
- `by_userId_createdAt` on `[userId, createdAt]`

---

### `sharedLinks` (P2)

| Field | Type | Description |
|---|---|---|
| `_id` | `Id<"sharedLinks">` | Auto-generated. |
| `userId` | `Id<"users">` | Owner of the link. |
| `storageId` | `Id<"_storage">` | Convex file storage reference. |
| `originalFilename` | `string` | For display on the preview page. |
| `outputFormat` | `string` | MIME type of the stored file. |
| `slug` | `string` | Short URL slug. |
| `expiresAt` | `number` | Unix timestamp (ms). TTL = 24h. |
| `downloadCount` | `number` | Track downloads. |
| `createdAt` | `number` | Unix timestamp (ms). |

**Indexes:**
- `by_slug` on `slug`
- `by_expiresAt` on `expiresAt`
- `by_userId` on `userId`

---

### `apiKeys` (P2)

| Field | Type | Description |
|---|---|---|
| `_id` | `Id<"apiKeys">` | Auto-generated. |
| `userId` | `Id<"users">` | Foreign key. |
| `keyHash` | `string` | SHA-256 hash of the API key (never store raw). |
| `label` | `string` | User-defined name for the key. |
| `lastUsedAt` | `number \| undefined` | Last request timestamp. |
| `createdAt` | `number` | Unix timestamp (ms). |

**Indexes:**
- `by_keyHash` on `keyHash`
- `by_userId` on `userId`

---

### Client-Side Types (No Database)

These types exist only in component state or session storage:

```typescript
type ImageFormat = "png" | "jpg" | "webp" | "svg";

type SourceImage = {
  file: File;
  name: string;
  format: ImageFormat;
  width: number;
  height: number;
  sizeBytes: number;
  objectUrl: string;
};

type ConvertedImage = {
  blob: Blob;
  name: string;
  format: ImageFormat;
  width: number;
  height: number;
  sizeBytes: number;
  objectUrl: string;
  quality: number | null;
};
```

---

## Component Inventory

### Layout Components

| Component | File | Description |
|---|---|---|
| `RootLayout` | `app/layout.tsx` | HTML shell, font loading, Convex provider, global styles. |
| `Header` | `components/layout/header.tsx` | Logo, nav links (History, Pricing), auth button. Sticky on scroll. |
| `Footer` | `components/layout/footer.tsx` | Privacy note ("Your images never leave your browser"), legal links. |
| `MobileNav` | `components/layout/mobile-nav.tsx` | Slide-out menu for viewports < 768px. |

### Converter Components

| Component | File | Description |
|---|---|---|
| `DropZone` | `components/converter/drop-zone.tsx` | Drag-and-drop area with click-to-browse fallback. States: idle, hover, loaded, error. Props: `onFileAccepted(file)`, `onError(msg)`. |
| `FormatPicker` | `components/converter/format-picker.tsx` | Segmented control for target format (PNG, JPG, WebP, SVG). Props: `value`, `onChange`, `sourceFormat`. |
| `QualitySlider` | `components/converter/quality-slider.tsx` | Range input for JPG/WebP quality. Displays estimated output size. Hidden for PNG/SVG. |
| `ResizeControls` | `components/converter/resize-controls.tsx` | Width/height inputs with aspect-ratio lock toggle. |
| `ImagePreview` | `components/converter/image-preview.tsx` | Renders image with metadata overlay (dimensions, size, format badge). |
| `ComparisonSlider` | `components/converter/comparison-slider.tsx` | Draggable overlay comparing original vs. converted. |
| `DownloadButton` | `components/converter/download-button.tsx` | Triggers browser download. Shows filename + file size. |
| `ConversionStatus` | `components/converter/conversion-status.tsx` | Progress indicator during conversion. |

### History Components

| Component | File | Description |
|---|---|---|
| `HistoryList` | `components/history/history-list.tsx` | Paginated table of past conversions with cursor-based loading. |
| `HistoryItem` | `components/history/history-item.tsx` | Single row: filename, formats, size delta, timestamp, delete button. |
| `EmptyHistory` | `components/history/empty-history.tsx` | Empty state with CTA to convert first image. |

### Auth Components

| Component | File | Description |
|---|---|---|
| `AuthButton` | `components/auth/auth-button.tsx` | Sign in / user avatar dropdown. |
| `AuthGuard` | `components/auth/auth-guard.tsx` | Wrapper that redirects unauthenticated users to `/login`. |

### Shared / UI Components

| Component | File | Description |
|---|---|---|
| `Button` | `components/ui/button.tsx` | Primary, secondary, ghost variants. |
| `Card` | `components/ui/card.tsx` | Container with border and shadow. |
| `Modal` | `components/ui/modal.tsx` | Dialog overlay. Used for upsell, confirmation. |
| `Slider` | `components/ui/slider.tsx` | Styled range input. |
| `Badge` | `components/ui/badge.tsx` | Format tags, plan indicators. |
| `Toast` | `components/ui/toast.tsx` | Transient notifications (batch upsell, clipboard confirmation). |
| `Skeleton` | `components/ui/skeleton.tsx` | Loading placeholder for async content. |

### Hooks & Utilities

| Name | File | Description |
|---|---|---|
| `useImageConverter` | `hooks/use-image-converter.ts` | Core hook: takes `SourceImage` + target format + quality + resize params, returns `ConvertedImage` + loading + error. Wraps Canvas API logic. |
| `useDropZone` | `hooks/use-drop-zone.ts` | Manages drag state, file validation, and paste-from-clipboard listener. |
| `useDarkMode` | `hooks/use-dark-mode.ts` | System preference detection + manual override via `localStorage`. |
| `ConversionEngine` | `lib/conversion-engine.ts` | Pure function: takes `File` + options, returns `Blob`. Uses OffscreenCanvas when available. |
| `SvgTracer` | `lib/svg-tracer.ts` | Client-side raster-to-SVG vectorization via color quantization + path tracing. |
| `formatFileSize` | `lib/format-file-size.ts` | Formats bytes to human-readable string (e.g., "1.2 MB"). |
| `getImageDimensions` | `lib/get-image-dimensions.ts` | Loads image into an `Image` element to extract intrinsic width/height. Returns a promise. |

---

## Non-Functional Requirements

| Concern | Target |
|---|---|
| **Performance** | Conversion < 3s for images up to 10 MP. No main-thread blocking > 500ms. Conversion engine loaded via dynamic import. LCP < 1.5s on 4G. |
| **Privacy** | Zero image data leaves the browser for free-tier single-file conversion. No telemetry on image content. |
| **Bundle Size** | Core converter page JS < 150 KB gzipped. SVG tracer lazy-loaded separately. |
| **Browser Support** | Latest 2 versions of Chrome, Firefox, Safari, Edge. |
| **Accessibility** | WCAG 2.1 AA. All controls keyboard-navigable. Screen reader announcements for conversion status changes. |
| **SEO** | Static metadata on `/` and `/about`. OG image and description for social sharing. |
