---
name: compare
description: Create visual comparison pages to evaluate design options side-by-side. Use when the user needs to compare icons, UI components, color palettes, typography, layouts, animations, or any visual/functional alternatives. Triggers on requests like "compare these icons", "show me options for", "which one looks better", "help me choose between", "create a comparison page", or when exploring multiple design variants.
---

# Compare

Create a dedicated comparison page in the project to display options side-by-side for visual evaluation.

## Workflow

1. **Identify comparison type** - Determine what's being compared (icons, components, colors, layouts, etc.)
2. **Research options** - Search icon libraries, component patterns, or generate variants
3. **Create comparison page** - Build a `/[topic]/page.tsx` route with organized sections
4. **Add suggested pairings** - Group logical combinations when comparing for specific use cases

## Page Template

Create pages at `app/(protected)/(with-sidebar)/[topic]/page.tsx`.

```tsx
"use client";

// 1. Imports

// 2. Card component for individual items
interface ItemCardProps {
  name: string;
  subtitle?: string;
  // ... other props specific to comparison type
}

function ItemCard({ name, subtitle }: ItemCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
      {/* Render the item here */}
      <div className="text-center">
        <p className="text-sm font-medium">{name}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// 3. Sections array
const SECTIONS = [
  {
    title: "Category Name",
    description: "Optional description",
    items: [
      { name: "Item 1" },
      { name: "Item 2" },
    ],
  },
];

// 4. Page component
export default function ComparePage() {
  return (
    <main className="h-full w-full overflow-y-auto p-6 bg-background">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">[Topic]</h1>
          <p className="text-muted-foreground">[Description]</p>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-foreground/80">
                {section.title}
              </h2>
              {"description" in section && section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {section.items.map((item) => (
                <ItemCard key={item.name} {...item} />
              ))}
            </div>
          </div>
        ))}

        {/* Size/Scale Comparison (optional) */}
        <div className="pt-8 border-t border-border space-y-4">
          <h2 className="text-lg font-medium">Size Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Same item at different sizes
          </p>
          <div className="flex items-end gap-8 p-6 rounded-lg border border-border bg-card">
            {[16, 24, 32, 48].map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                {/* Render item at this size */}
                <span className="text-xs text-muted-foreground">{size}px</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Pairings */}
        <div className="pt-8 border-t border-border space-y-6">
          <div>
            <h2 className="text-lg font-medium">Suggested Pairings</h2>
            <p className="text-sm text-muted-foreground">
              [Pairing rationale]
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pairing cards here */}
          </div>
        </div>
      </div>
    </main>
  );
}
```

## Pairing Card Template

Side-by-side comparison for decision-making:

```tsx
<div className="p-6 rounded-lg border border-border bg-card space-y-4">
  <h3 className="font-medium">Option A vs Option B</h3>
  <p className="text-xs text-muted-foreground">[Differentiator]</p>
  <div className="flex items-center gap-8">
    <div className="flex flex-col items-center gap-2">
      {/* Option A */}
      <span className="text-sm">Label A</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      {/* Option B */}
      <span className="text-sm">Label B</span>
    </div>
  </div>
</div>
```

## Icon Comparison

For icon comparisons using HugeIcons:

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { IconNameIcon } from "@hugeicons/core-free-icons";

// In ItemCard:
<HugeiconsIcon icon={icon} size={32} strokeWidth={1.5} />

// For size comparison:
<HugeiconsIcon icon={icon} size={size} strokeWidth={1.5} />
```

Search available icons:
```bash
cat node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts | grep -iE "keyword"
```

Install if needed:
```bash
npm install @hugeicons/react @hugeicons/core-free-icons
```

## Styling Reference

| Element | Classes |
|---------|---------|
| Page container | `h-full w-full overflow-y-auto p-6 bg-background` — **Note:** the app layout uses `overflow-hidden` all the way down; `flex-1` alone does not create a scrollable height, so `h-full overflow-y-auto` is required on the page root |
| Content wrapper | `max-w-5xl mx-auto w-full space-y-8` |
| Header title | `text-2xl font-semibold` |
| Header description | `text-muted-foreground` |
| Section title | `text-lg font-medium text-foreground/80` |
| Section description | `text-sm text-muted-foreground` |
| Item grid | `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4` |
| Item card | `flex flex-col items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors` |
| Item name | `text-sm font-medium` |
| Item subtitle | `text-xs text-muted-foreground` |
| Section divider | `pt-8 border-t border-border` |
| Pairing card | `p-6 rounded-lg border border-border bg-card space-y-4` |
| Pairing title | `font-medium` |
| Comparison container | `flex items-center gap-8` |
| Size label | `text-xs text-muted-foreground` |
