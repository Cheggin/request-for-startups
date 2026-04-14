# Plan: Tab Commander — Chrome Extension for Tab Keyboard Shortcuts

## Idea

A Chrome extension that lets you remap and add keyboard commands for tab management. Chrome's built-in shortcuts are limited and annoying — this fixes that.

## Core Problems It Solves

1. **Cmd+T creates tabs at the far right** — should create next to current tab
2. **No way to move tabs by keyboard** — you're forced to drag with a mouse
3. **No quick-jump to tab N** — you can only cycle through with Cmd+Option+Arrow
4. **No way to move a tab to first/last position** — drag-only
5. **No "send tab to window"** — requires drag between windows

## Features (P0)

| Command | Default Shortcut | What It Does |
|---------|-----------------|--------------|
| New tab beside current | Cmd+T (remapped) | Creates tab immediately right of current |
| Move tab left | Cmd+Shift+[ | Moves current tab one position left |
| Move tab right | Cmd+Shift+] | Moves current tab one position right |
| Move tab to first | Cmd+Shift+Home | Moves current tab to position 0 |
| Move tab to last | Cmd+Shift+End | Moves current tab to last position |
| Jump to tab N | Cmd+1-9 (enhanced) | Jump to tab by number (Chrome only does 1-8 + last) |
| Close other tabs | Cmd+Shift+W | Close all tabs except current |
| Duplicate tab | Cmd+D | Duplicate current tab beside it |
| Pin/Unpin toggle | Cmd+Shift+P | Toggle pin on current tab |
| Merge all windows | Cmd+Shift+M | Merge all windows into one |

## Features (P1)

| Command | What It Does |
|---------|--------------|
| Tab search | Fuzzy search across all open tabs (like Cmd+K) |
| Tab groups by domain | Auto-group tabs by domain |
| Save tab session | Save all open tabs as a named session |
| Restore session | Restore a saved session |
| Custom shortcut mapping | User defines their own shortcuts for any action |

## Stack

| Layer | Choice |
|-------|--------|
| Extension framework | Chrome Manifest V3 |
| Language | TypeScript |
| Build | Vite + CRXJS (Chrome extension Vite plugin) |
| UI (popup/options) | React + Tailwind (minimal settings page) |
| Storage | chrome.storage.sync (syncs across devices) |
| Packaging | Chrome Web Store |

## Architecture

```
tab-commander/
├── src/
│   ├── background/
│   │   └── service-worker.ts    # Command handler — listens for shortcuts, executes tab actions
│   ├── content/
│   │   └── content-script.ts    # Optional: override Cmd+T within page context
│   ├── popup/
│   │   ├── Popup.tsx            # Quick settings + command palette
│   │   └── index.html
│   ├── options/
│   │   ├── Options.tsx          # Full shortcut customization page
│   │   └── index.html
│   ├── lib/
│   │   ├── tab-actions.ts       # Core: move, create, close, group, merge
│   │   ├── shortcuts.ts         # Shortcut registry + conflict detection
│   │   └── storage.ts           # chrome.storage.sync wrapper
│   └── manifest.json            # Manifest V3 with commands
├── public/
│   └── icons/                   # Extension icons (16, 48, 128)
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Key Chrome APIs

```typescript
// Create tab next to current
chrome.tabs.create({ 
  index: currentTab.index + 1, 
  active: true 
});

// Move tab to position
chrome.tabs.move(tabId, { index: newIndex });

// Get current tab
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

// Listen for keyboard commands (Manifest V3)
chrome.commands.onCommand.addListener((command) => {
  // handle "move-tab-left", "move-tab-right", etc.
});

// Pin/Unpin
chrome.tabs.update(tabId, { pinned: !tab.pinned });

// Group tabs
chrome.tabs.group({ tabIds: [tab1, tab2] });

// Merge windows
const windows = await chrome.windows.getAll({ populate: true });
// move all tabs to first window
```

## Manifest V3 Commands (max 4 in manifest, rest via content script)

```json
{
  "commands": {
    "move-tab-left": {
      "suggested_key": { "mac": "MacCtrl+Shift+Left" },
      "description": "Move current tab one position left"
    },
    "move-tab-right": {
      "suggested_key": { "mac": "MacCtrl+Shift+Right" },
      "description": "Move current tab one position right"
    },
    "new-tab-beside": {
      "suggested_key": { "mac": "MacCtrl+T" },
      "description": "New tab beside current"
    },
    "tab-search": {
      "suggested_key": { "mac": "MacCtrl+Shift+K" },
      "description": "Search open tabs"
    }
  }
}
```

Note: Chrome limits manifest commands to 4. Additional shortcuts handled via content script key listeners or the popup command palette.

## Shortcut Remapping UI

The options page lets users:
1. See all available actions
2. Click a shortcut field and press their desired key combo
3. Detect conflicts with Chrome built-ins or other extensions
4. Reset to defaults
5. Import/export shortcut configs

Stored in `chrome.storage.sync` so shortcuts sync across devices.

## Implementation Order

### Batch 1: Core Tab Actions
1. Scaffold with Vite + CRXJS + Manifest V3
2. Service worker with command listener
3. `tab-actions.ts`: create-beside, move-left, move-right, move-to-first, move-to-last
4. Wire 4 manifest commands
5. Test in Chrome (load unpacked)

### Batch 2: Extended Actions
6. Duplicate tab, close-others, pin-toggle
7. Merge-all-windows
8. Content script for additional keyboard listeners
9. Popup with action list + trigger buttons

### Batch 3: Settings + Search
10. Options page with shortcut customization
11. Tab search (fuzzy, across all windows)
12. Conflict detection
13. chrome.storage.sync for settings

### Batch 4: Polish + Publish
14. Icons + branding
15. Chrome Web Store listing
16. Screenshots + description

## Competitors

- **Vimium** — keyboard-driven browsing but focused on vim motions, not tab management
- **Tab Manager Plus** — UI-heavy, not keyboard-first
- **Toby** — tab organization/saving but no keyboard shortcuts
- **Tab Wrangler** — auto-closes idle tabs, different use case

**Differentiation:** Keyboard-first tab management. No bloat, no UI required for core actions. Just remap and go.

## Revenue Model

Free with optional Pro:
- **Free**: All P0 features, up to 10 custom shortcuts
- **Pro ($3.99 one-time)**: Unlimited shortcuts, session save/restore, tab groups, cross-device sync

## Harness Phases Used

- Phase 0: Founder Interview (idea, type=devtool, audience=power users)
- Phase 1: Service Validation (gh, Chrome Web Store developer account)
- Phase 2: Research (competitor analysis)
- Phase 3: Spec (features, shortcuts, manifest)
- Phase 5-7: Build (Vite + CRXJS scaffold, TDD, Cubic review)
- Phase 8-9: Deploy (Chrome Web Store publish)
- Phase 10: Growth (Product Hunt, Reddit r/chrome, HN Show)

Skip: Phase 4 (Design — minimal UI), Growth intelligence (not needed for extension)
