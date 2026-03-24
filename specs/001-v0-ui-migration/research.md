# Research: v0-UI Migration

**Phase 0 output for**: `001-v0-ui-migration`
**Date**: 2026-03-20

## 1. Tailwind v4 with electron-vite (Vite)

**Decision**: Use `@tailwindcss/vite` Vite plugin (NOT PostCSS config).

**Rationale**: The v0-ui uses `@tailwindcss/postcss` because it is a Next.js project.
electron-vite uses Vite under the hood. Tailwind v4 ships a dedicated Vite plugin
(`@tailwindcss/vite`) that integrates directly with the Vite build pipeline and is
the recommended approach for Vite-based projects. It eliminates the need for a
`postcss.config.mjs` file.

**Setup**:
```ts
// electron.vite.config.ts
import tailwindcss from '@tailwindcss/vite'
renderer: {
  plugins: [react(), tailwindcss()],
}
```

```css
/* src/renderer/globals.css — replaces postcss directives */
@import "tailwindcss";
/* custom theme tokens from _v0-ui/app/globals.css go here */
```

**Alternatives considered**:
- PostCSS config: Works but adds unnecessary indirection when Vite plugin exists.
- Tailwind v3: v0-ui is already on v4; downgrading would require rewriting all CSS.

---

## 2. Path alias `@/` in electron-vite

**Decision**: Configure `resolve.alias` in `electron.vite.config.ts` renderer section
to map `@/` → `src/renderer/`.

**Rationale**: All v0 components use `@/components/...` and `@/lib/...` imports.
Keeping the same alias during migration avoids a full import rewrite pass.

**Setup**:
```ts
import { resolve } from 'path'
renderer: {
  resolve: {
    alias: { '@': resolve('src/renderer') },
  },
  plugins: [react(), tailwindcss()],
}
```

**Alternatives considered**:
- Rewrite all imports to relative paths: Tedious and error-prone for ~12 components.
- Use `tsconfig.json` paths only: Vite also needs the alias or runtime resolution fails.

---

## 3. Zustand store design (v0 mock → real IPC)

**Decision**: Adapt `_v0-ui/lib/store.ts` to a new `src/renderer/store.ts` that:
1. Replaces the `Trip` type with the canonical `Trip` from `src/interfaces/trips.ts`.
2. Removes all `sampleTrips` mock data.
3. Adds an `initialize()` action that calls `window.api.trips.list()` and
   `window.api.clips.list()` to hydrate the store on mount.
4. Settings slice calls `window.api.settings.*` for reads and writes.

**Rationale**: The store is the single source of client-side state. Keeping it as
a thin adapter over the IPC layer respects the Core-First principle and avoids
duplicating data-fetching logic across components.

**Type reconciliation** — v0 `Trip` vs `src/interfaces/trips.ts` `Trip`:

| v0 field | Interface field | Mapping |
|----------|-----------------|---------|
| `id` | `id` | Direct |
| `name` | `name` | Direct |
| `date` + `time` | `startedAt: Date` | Derive via `date-fns` |
| `duration` | `totalDuration` (seconds) | Direct |
| `clipCount` | `clipCount` | Direct |
| `codec` `'lossless'\|'reencode'` | `codecCompat: 'lossless'\|'mixed'\|'incompatible'` | Map: lossless→lossless, else→reencode |
| `resolution` | n/a on Trip | Pull from first clip's `width × height` |
| `folderPath` | n/a on Trip | Pull from first clip's `path` dirname |
| `thumbnails` | n/a on Trip | Load from `window.api.thumbnails.getForTrip(id)` |
| `connected` | `status: 'ok'\|'partial'\|'missing'` | Map: ok→true, else→false |

**Alternatives considered**:
- Two separate types (UI Trip + Interface Trip): Creates a translation layer that adds
  complexity for no benefit (Principle VI violation).

---

## 4. Removing Next.js-specific patterns

**Decision**: Strip the following from every copied v0 component:

| Pattern | Replacement |
|---------|-------------|
| `"use client"` directive | Remove entirely (not needed in Vite/Electron) |
| `@/` imports | Kept as-is (handled by Vite alias — see §2) |
| `next/image`, `next/link` | Not used in the v0 UI components |
| `next-themes` (`ThemeProvider`) | Replace with a simple `dark` class on `<html>` (Electron app, always dark) |
| `@vercel/analytics` | Remove (not applicable to Electron) |

**Rationale**: These are build-system artifacts, not React logic. Removal is
mechanical and leaves component rendering logic untouched.

---

## 5. shadcn/ui component installation strategy

**Decision**: Copy the `_v0-ui/components/ui/` directory verbatim to
`src/renderer/components/ui/`. Do NOT use the `shadcn` CLI to re-generate.

**Rationale**: The v0 components are already generated and customized for the dashcam
design system (dark theme, amber accent tokens). Re-generating via the CLI would
overwrite the design tokens. Copying preserves them exactly.

**Components needed** (used by the 5 main components):

| Component | Used by |
|-----------|---------|
| `button`, `badge`, `separator` | All screens |
| `toggle-group` | LibraryView |
| `select` | LibraryView, SettingsView, ExportDrawer |
| `input`, `label` | ExportDrawer, SettingsView |
| `radio-group` | ExportDrawer |
| `progress` | ExportDrawer |
| `sheet` (drawer) | ExportDrawer |
| `slider` | PlayerView |
| `table` | SettingsView |
| `tooltip` | SettingsView |
| `scroll-area` | PlayerView filmstrip |
| `sidebar` | App shell |

**Dependencies to install** (from v0 `package.json`, renderer-only):
```
tailwindcss @tailwindcss/vite
zustand
lucide-react
clsx tailwind-merge class-variance-authority
@radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label
@radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area
@radix-ui/react-select @radix-ui/react-separator @radix-ui/react-sheet
@radix-ui/react-slider @radix-ui/react-slot @radix-ui/react-switch
@radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle
@radix-ui/react-toggle-group @radix-ui/react-tooltip
```

Note: `@radix-ui/react-sheet` does not exist — `Sheet` in shadcn is built on
`@radix-ui/react-dialog`. The `ExportDrawer` uses `Sheet` from shadcn which wraps
dialog. Verify the generated `sheet.tsx` imports.

---

## 6. Clips tab preservation

**Decision**: Keep the Clips tab (list of individual clips) in the Library alongside
the Trips view. The v0 design does not include it, but it is an existing capability
and removing it would violate Principle II (Dual-Surface Parity) — the CLI has
`dashcam scan` which surfaces clips directly.

**Implementation**: The `Library.tsx` rewrite retains the tabs pattern (Clips / Trips)
from the current code. The v0 `LibraryView` layout (toolbar + grid) is used as the
shell; the tab bar is retained above the toolbar.

---

## 7. hover-scrub performance

**Decision**: Implement hover-scrub using `onMouseMove` on the card element,
computing `Math.floor(offsetX / cardWidth * thumbnails.length)` to select the
thumbnail index. No third-party scrub library needed.

**Rationale**: The existing `TripCard` in v0 uses `thumbnails` array from the store.
With real data, thumbnails come from `window.api.thumbnails.getForTrip(id)` loaded
on mount. Frame-switching is pure DOM (swap `src` or `backgroundImage`), which stays
well within the 50 ms budget.

**Alternatives considered**:
- Canvas-based scrubbing: Overkill for static thumbnail arrays; adds complexity.
- CSS sprite sheets: Requires server-side pre-processing not available in Electron.
