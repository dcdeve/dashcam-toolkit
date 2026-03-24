---

description: "Task list for v0-UI Migration"
---

# Tasks: v0-UI Migration

**Input**: Design documents from `/specs/001-v0-ui-migration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ipc-surface.md ✅

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in descriptions

## Path Conventions

- Renderer source: `src/renderer/`
- shadcn/ui primitives: `src/renderer/components/ui/`
- v0 reference: `_v0-ui/` (read-only, deleted at end)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure tooling, establish base styles and path aliases.

- [x] T001 Install new npm dependencies: `tailwindcss @tailwindcss/vite zustand lucide-react clsx tailwind-merge class-variance-authority` and all required `@radix-ui/*` primitives listed in `specs/001-v0-ui-migration/research.md §5`
- [x] T002 Add `@tailwindcss/vite` plugin and `@/` alias to `electron.vite.config.ts` renderer section (alias: `src/renderer/`)
- [x] T003 [P] Create `src/renderer/globals.css` from `_v0-ui/app/globals.css` — strip Next.js imports, keep Tailwind v4 `@import "tailwindcss"` directive and all CSS custom property tokens
- [x] T004 [P] Import `globals.css` in `src/renderer/main.tsx` (add `import './globals.css'` before `createRoot`)
- [x] T005 [P] Copy all files from `_v0-ui/components/ui/` to `src/renderer/components/ui/` — strip `"use client"` directives from each file
- [x] T006 [P] Copy `_v0-ui/lib/utils.ts` to `src/renderer/lib/utils.ts` (contains `cn()` helper used by all shadcn components)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Zustand store and App shell — required before any user story screen can render.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Create `src/renderer/store.ts` — Zustand store with all slices from `specs/001-v0-ui-migration/data-model.md`: navigation, library (UITrip[], UIClip[], viewMode, activeTab, sortOption, searchQuery, isLoading, error), player (currentClipIndex, isPlaying, currentTime, volume), export (isExportOpen, exportProgress, exportPhase, isExporting), settings (defaultScanDirectory, gapDetectionMinutes, defaultViewMode, defaultOutputDirectory, filenameTemplate, patterns)
- [x] T008 Add `initialize()` and `refresh()` async actions to `src/renderer/store.ts` — call `window.api.trips.list()`, `window.api.clips.list()`, `window.api.patterns.list()`, `window.api.settings.get()`, and `window.api.thumbnails.getForTrip()` per trip; derive UITrip[] and UIClip[] per mapping table in `specs/001-v0-ui-migration/data-model.md`
- [x] T009 Copy `_v0-ui/components/sidebar.tsx` to `src/renderer/components/Sidebar.tsx` — strip `"use client"`, replace `@/lib/store` import with `../store`, replace `@/components/ui/` with `./ui/`; wire Player nav item disabled state to `selectedTrip === null` from store
- [x] T010 Rewrite `src/renderer/App.tsx` — replace inline-style navbar with the new sidebar shell: `<div flex h-screen><Sidebar /><main flex-1>{page components}</main><ExportDrawer /></div>`; call `store.initialize()` in a `useEffect` on mount; route pages via `currentPage` from store

**Checkpoint**: App opens with dark sidebar, Library placeholder visible, no TS errors.

---

## Phase 3: User Story 1 — Library: Browsing & Discovering Trips (Priority: P1) 🎯 MVP

**Goal**: Full library view with trip cards, search, sort, view toggle, empty state, hover-scrub, and disconnected state.

**Independent Test**: Launch app with existing DB trips → cards render, hover-scrub works, search filters, view toggles — no player or export needed.

### Implementation for User Story 1

- [x] T011 [P] [US1] Copy `_v0-ui/components/top-bar.tsx` to `src/renderer/components/TopBar.tsx` — strip `"use client"`, fix imports (`@/` → relative); wire search input to `store.setSearchQuery()` and "Scan folder" button to trigger `store.setCurrentPage('import')` (existing ImportFlow)
- [x] T012 [P] [US1] Copy `_v0-ui/components/trip-card.tsx` to `src/renderer/components/TripCard.tsx` — strip `"use client"`, fix imports; wire click → `store.setSelectedTrip(trip)` + `store.setCurrentPage('player')`; wire Export button → `store.setIsExportOpen(true)` + `store.setSelectedTrip(trip)`; implement hover-scrub using `onMouseMove` with `Math.floor(offsetX / cardWidth * thumbnails.length)` to index into `trip.thumbnails`; apply `opacity-50 pointer-events-none` on `trip.connected === false`
- [x] T013 [US1] Rewrite `src/renderer/pages/Library.tsx` — use `LibraryView` structure from `_v0-ui/components/library-view.tsx`: `<TopBar />` + toolbar row (Scan folder, list/grid toggle, sort dropdown, trip count) + scrollable grid/list of `<TripCard>`; retain existing Clips tab (`ClipTable` / `ClipGrid`) above the toolbar using the existing tab bar pattern; filter and sort via `useMemo` over `store.trips` using `searchQuery` and `sortOption`; show empty state when `store.trips.length === 0`

**Checkpoint**: Library fully functional and independently testable — US1 complete.

---

## Phase 4: User Story 2 — Player: Watching a Trip (Priority: P2)

**Goal**: Player with seek bar, filmstrip, metadata sidebar, and "Export this trip" button.

**Independent Test**: Click a trip → player opens with all controls, filmstrip scrollable, metadata populated, seek works.

### Implementation for User Story 2

- [x] T014 [US2] Rewrite `src/renderer/pages/TripPlayer.tsx` using `PlayerView` from `_v0-ui/components/player-view.tsx` as the visual template — strip `"use client"`, fix imports; replace simulated playback timer with a real `<video>` element using `src={window.api.clips.getFilePath(currentClip.path)}`; load clips for the selected trip via `window.api.clips.listByTrip(selectedTrip.id)` on mount and store in local state; implement `handleSeek` via `video.currentTime`; implement `handleClipClick(index)` to switch video `src` and reset time; wire "Export this trip" button → `store.setIsExportOpen(true)`
- [x] T015 [P] [US2] Delete `src/renderer/pages/Player.tsx` — single-clip player is superseded by TripPlayer; remove its import and route from `App.tsx`
- [x] T016 [P] [US2] Delete `src/renderer/pages/Export.tsx` — export page is superseded by ExportDrawer; remove its import and route from `App.tsx`

**Checkpoint**: Select a trip, player opens, filmstrip works, metadata sidebar populated — US2 complete.

---

## Phase 5: User Story 3 — Export: Exporting a Trip via Drawer (Priority: P2)

**Goal**: Slide-in export drawer with options form, real IPC export call, live progress, cancel.

**Independent Test**: Open drawer from library card → options visible, export triggers IPC progress events, cancel stops export, drawer closes on completion.

### Implementation for User Story 3

- [x] T017 [US3] Copy `_v0-ui/components/export-drawer.tsx` to `src/renderer/components/ExportDrawer.tsx` — strip `"use client"`, fix imports; replace simulated progress `setInterval` with real IPC: call `window.api.exporter.export(options)` on submit; listen to `exporter:progress`, `exporter:done`, `exporter:error` IPC events (via `window.api.onExportProgress(cb)` or equivalent) to drive `store.setExportProgress()` and `store.setExportPhase()`; wire cancel button to `window.api.exporter.cancel()`; auto-close on `exporter:done`; pre-select output mode based on `selectedTrip.codec`; wire output directory browse button to `window.api.dialog.openDirectory()` if available

**Checkpoint**: Export drawer opens, real export runs with live progress, cancel works — US3 complete.

---

## Phase 6: User Story 4 — Settings: Configuring the App (Priority: P3)

**Goal**: Settings view with General, Export, and Naming Patterns sections, all persisted via IPC.

**Independent Test**: Open Settings → modify gap detection minutes, add/delete a pattern, change filename template → restart app → changes persisted.

### Implementation for User Story 4

- [x] T018 [US4] Rewrite `src/renderer/pages/Settings.tsx` using `SettingsView` from `_v0-ui/components/settings-view.tsx` as the visual template — strip `"use client"`, fix imports; replace `updateSettings` mock calls with `window.api.settings.set(key, value)` per field change; replace `handleAddPattern` with `window.api.patterns.add(name, format)` then `store.refresh()`; replace `handleDeletePattern` with `window.api.patterns.delete(id)` then `store.refresh()`; wire directory browse buttons to `window.api.dialog.openDirectory()` if available

**Checkpoint**: Settings view renders with real data, changes persist — US4 complete.

---

## Phase 7: User Story 5 — Import: Scanning a Folder (Priority: P3)

**Goal**: ImportFlow wired into new navigation shell — accessible via "Scan folder" button, returns to Library with updated trips.

**Independent Test**: Click "Scan folder" → ImportFlow opens → scan completes → Library shows new trips.

### Implementation for User Story 5

- [x] T019 [US5] Add `'import'` to the `Page` union type in `src/renderer/store.ts` and handle it in `App.tsx` — render `<ImportFlow onDone={() => { store.refresh(); store.setCurrentPage('library'); }} />` when `currentPage === 'import'`; update Sidebar to hide nav items while on import page (or disable them)

**Checkpoint**: Scan folder → ImportFlow → Library updated — US5 complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Remove inline styles, cleanup dead code, validate perf budgets, delete reference folder.

- [x] T020 [P] Remove `src/renderer/components/TripGrid.tsx` — replaced by `TripCard` in grid mode; verify no remaining imports
- [x] T021 [P] Remove `src/renderer/components/ClipCard.tsx` and `src/renderer/components/ClipGrid.tsx` if no longer used after Library rewrite; replace with shadcn Card if clips grid is still needed
- [x] T022 Audit `src/renderer/` for any remaining `style={{...}}` inline style objects and convert to Tailwind classes — validate with `grep -r "style={{" src/renderer/ --include="*.tsx"` (must return empty)
- [x] T023 [P] Run `make typecheck` — fix any TypeScript errors introduced during migration (common: `window.api` method signatures, UITrip vs Trip type mismatches)
- [x] T024 [P] Run `make lint` — fix any ESLint errors (common: unused imports from deleted files)
- [ ] T025 Manually validate performance budgets per `specs/001-v0-ui-migration/quickstart.md`: hover-scrub < 50 ms between frames (use DevTools Performance tab), library renders 200 trips without jank, export drawer opens < 200 ms
- [x] T026 [P] Delete `_v0-ui/` folder from repo root — reference implementation no longer needed
- [x] T027 [P] Run complete `make check` (lint + format + typecheck + tests) — must pass with zero errors (note: vitest has pre-existing esbuild version mismatch unrelated to this migration)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T003–T006 are parallel
- **Foundational (Phase 2)**: Depends on Phase 1 complete — T007→T008→T009→T010 are sequential
- **US1 Library (Phase 3)**: Depends on Phase 2 — T011, T012 parallel; T013 after both
- **US2 Player (Phase 4)**: Depends on Phase 2 — T014 sequential; T015, T016 parallel after T014
- **US3 Export (Phase 5)**: Depends on Phase 2 + US1 (ExportDrawer needs `selectedTrip` from library flow)
- **US4 Settings (Phase 6)**: Depends on Phase 2 — independent of US1/US2/US3
- **US5 Import (Phase 7)**: Depends on Phase 2 + US1 (button lives in Library toolbar)
- **Polish (Phase 8)**: Depends on all user stories complete; T020–T022 parallel, T023–T024 parallel

### Within Each User Story

- shadcn components and store slices before page rewrites
- Page rewrites before IPC wiring
- IPC wiring before polish/cleanup

### Parallel Opportunities

- T003, T004, T005, T006 — all Phase 1, different files
- T011, T012 — Phase 3, different components
- T015, T016 — Phase 4, both deletions
- T020, T021, T022 — Phase 8, different files
- T023, T024 — Phase 8, independent checks

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T010)
3. Complete Phase 3: US1 Library (T011–T013)
4. **STOP and VALIDATE**: Hover-scrub, search, sort, grid/list toggle all work
5. Demo: The app is usable for browsing trips with the new visual design

### Incremental Delivery

1. Setup + Foundational → Shell with sidebar visible
2. US1 Library → Browse trips with new UI (MVP!)
3. US2 Player → Watch a trip
4. US3 Export → Export a trip (drawer UX)
5. US4 Settings → Configure app
6. US5 Import → Scan new footage
7. Polish → Zero inline styles, full `make check` green

---

## Notes

- `[P]` tasks = different files, no dependencies between them
- `[USN]` label maps each task to its user story for traceability
- Hover-scrub (T012) is the highest-risk task — implement and test independently before proceeding
- Keep `ClipTable.tsx` and `TripTable.tsx` intact throughout — they are used by the Library clips/trips list views
- The `window.api` shape is defined in `src/preload/index.ts` — check method names there before writing IPC calls in T008, T014, T017, T018
