# Product Specification: Click Counter App

## Stack

- Next.js 15 (App Router)
- Tailwind CSS v4
- TypeScript

---

## 1. Pages & Routes

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Counter | Single-page app displaying a counter value and an increment button |

---

## 2. Features

### P0 — Must Have

#### F-001: Display Counter Value

The app displays the current count as a visible number on the page.

**Acceptance Criteria:**

- AC-001: On initial page load, the displayed count is `0`.
- AC-002: The count is rendered inside an element with `data-testid="count-display"`.
- AC-003: The displayed value is a non-negative integer.

#### F-002: Increment Counter on Click

Clicking the button increments the displayed count by exactly 1.

**Acceptance Criteria:**

- AC-004: Clicking the button once changes the displayed count from `0` to `1`.
- AC-005: Clicking the button 10 times in sequence results in a displayed count of `10`.
- AC-006: Each click increments the count by exactly 1 (no skips, no double-increments).
- AC-007: The button is rendered with `data-testid="increment-button"`.

#### F-003: No Persistence

Count resets on page refresh. No server state, no database, no local storage.

**Acceptance Criteria:**

- AC-008: Refreshing the page resets the count to `0`.
- AC-009: No network requests are made to store or retrieve the count.

### P1 — Should Have

#### F-004: Accessible Button

The increment button meets basic accessibility requirements.

**Acceptance Criteria:**

- AC-010: The button element is a semantic `<button>` HTML element.
- AC-011: The button has visible text content (not empty).
- AC-012: The button is keyboard-focusable and can be activated with Enter or Space keys.

#### F-005: Responsive Layout

The counter UI is usable across viewport widths.

**Acceptance Criteria:**

- AC-013: At viewport width 375px, the button and count are fully visible without horizontal scrolling.
- AC-014: At viewport width 1440px, the button and count are fully visible and centered.

### P2 — Nice to Have

#### F-006: Visual Click Feedback

The button provides visual feedback on interaction.

**Acceptance Criteria:**

- AC-015: The button has a visible style change on hover (e.g., background color shift).
- AC-016: The button has a visible style change on active/pressed state.

---

## 3. Data Models

### Client-Side State

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `count` | `number` | `0` | Current counter value, managed via React `useState` |

No server-side data models, databases, or APIs required. All state is ephemeral and client-side.

---

## 4. Component Inventory

| Component | File | Props | Used In | Description |
|-----------|------|-------|---------|-------------|
| `RootLayout` | `app/layout.tsx` | `children: ReactNode` | Next.js runtime | Standard root layout with metadata and global styles |
| `CounterPage` | `app/page.tsx` | None | `RootLayout` | Client component (`"use client"`). Owns `count` state via `useState<number>(0)`. Composes `CountDisplay` and `IncrementButton`. |
| `CountDisplay` | `components/count-display.tsx` | `value: number` | `CounterPage` | Renders the current count with `data-testid="count-display"` |
| `IncrementButton` | `components/increment-button.tsx` | `onClick: () => void` | `CounterPage` | Renders the increment button with `data-testid="increment-button"`. Styled with hover/active states. |

---

## Non-Goals

- Decrement or reset functionality
- Persistence across refreshes
- Authentication or multi-user support
- Animations or transitions
- Dark mode
