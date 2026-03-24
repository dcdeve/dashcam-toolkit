# Tasks: Folder Browser — Library Navigation by Scanned Folder

**Input**: Design documents from `/specs/004-folder-browser/`
**Branch**: `004-folder-browser`
**Generated**: 2026-03-24

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Contract tests (T005) are required by the project constitution (Principle IV — Contract-First Testing).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup (DB Schema + Shared Types)

**Purpose**: Create the database table and shared type contracts that every other phase depends on.

- [x] T001 Add `scannedFolders` table definition to `src/core/modules/db/schema.ts` (sqliteTable, uniqueIndex on path)
- [x] T002 Create migration `resources/migrations/0002_scanned_folders.sql` (CREATE TABLE + unique index per data-model.md)
- [x] T003 [P] Create `src/interfaces/folders.ts` with `ScannedFolder`, `FolderHealthStatus`, `FolderHealthResult`, `FoldersModule`, `FoldersError`, and IPC channel shapes (from `specs/004-folder-browser/contracts/folders-module.ts`)
- [x] T004 [P] Add `FOLDERS.*` IPC channel constants (`folders:list`, `folders:healthCheck`, `folders:remove`) to `src/shared/ipc.ts`

**Checkpoint**: Schema and contracts in place — core module and renderer can now be built against them.

---

## Phase 2: Foundational (Core Module + Scanner Integration)

**Purpose**: Implement the `FoldersModule` and wire it into the scanner. MUST complete before any UI work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 Write contract tests `tests/contracts/folders.test.ts` covering all four `FoldersModule` operations (list, upsertAfterScan, healthCheck, remove) — run and confirm they FAIL before proceeding (RED phase)
- [x] T006 Implement `src/core/modules/folders/index.ts`: `list()`, `upsertAfterScan()` (SHA-256 hash per R-001), `healthCheck()` (fs metadata only, `ok/stale/unknown`), `remove()` (atomic transaction per R-005) — run contract tests until GREEN
- [x] T007 Integrate scanner → folders: call `folders.upsertAfterScan(dir, filesWithSizes)` in the scanner module after the `importing` phase (before `grouping`) per R-003 — find the hook point in `src/core/modules/scanner/index.ts` (or equivalent scanner file)

**Checkpoint**: `make test-contracts` passes. Scanner upserts a folder record on every successful scan.

---

## Phase 3: User Story 1 — Browse Trips by Folder (Priority: P1) 🎯 MVP

**Goal**: Library shows a folder grid as its default top-level view. Clicking a card shows only that folder's trips. A back button returns to the grid. Empty state shown when no folders exist.

**Independent Test**: Open the app with at least one scanned folder → Library shows folder grid → click a card → only trips from that folder appear → back button restores the folder grid.

- [x] T008 [P] [US1] Create `src/main/ipc/folders.ts` with `folders:list` and `folders:remove` IPC handlers (invoke `foldersModule.list()` and `foldersModule.remove()`)
- [x] T009 [US1] Register folders IPC handlers in `src/main/ipc/index.ts`
- [x] T010 [US1] Expose `window.api.folders.list()` and `window.api.folders.remove()` via `contextBridge` in `src/preload/index.ts`
- [x] T011 [US1] Add `UIFolder`, `FolderSortOption`, and folder grid state to `src/renderer/store.ts`: `folders: UIFolder[]`, `selectedFolderId: string | null`, `folderSortOption: FolderSortOption` (default `'health-stale-first'`), `setSelectedFolder()`, `setFolderSort()`, `loadFolders()` action (calls `window.api.folders.list()`)
- [x] T012 [P] [US1] Create `src/renderer/components/FolderCard.tsx` — card showing `displayName`, `tripCount`, `clipCount`, `lastScanAt`, delete action via ⋯ `DropdownMenu` with `AlertDialog` confirmation (calls `window.api.folders.remove()` then `loadFolders()`)
- [x] T013 [P] [US1] Create `src/renderer/components/FolderDetailView.tsx` — trip list filtered by `uiTrip.folderPath.startsWith(folder.path)` (per R-009), back button (`setSelectedFolder(null)`), and Rescan button stub
- [x] T014 [US1] Update `src/renderer/pages/Library.tsx` to render: folder grid (default, when `selectedFolderId === null`), empty state with scan CTA (when `folders.length === 0`), sort control with all four `FolderSortOption` values (sort applied client-side via `useMemo`), and `FolderDetailView` (when `selectedFolderId !== null`)

**Checkpoint**: Library two-level navigation fully functional. US1 acceptance scenarios pass.

---

## Phase 4: User Story 2 — Folder Health Check (Priority: P2)

**Goal**: Each folder card shows a live health badge (`checking` → `ok/stale/unknown`). Health checks run automatically and concurrently when the folder grid loads.

**Independent Test**: Scan a folder, add a video file outside the app, re-open the Library → folder card shows yellow "stale" badge after health check resolves.

- [x] T015 [US2] Add `folders:healthCheck` IPC handler to `src/main/ipc/folders.ts` (invoke `foldersModule.healthCheck(folderId)`)
- [x] T016 [US2] Expose `window.api.folders.healthCheck(folderId)` in `src/preload/index.ts`
- [x] T017 [US2] Add health check dispatch to `src/renderer/store.ts`: `runHealthChecks()` action that sets all `UIFolder.health` to `'checking'`, then fires concurrent `window.api.folders.healthCheck()` calls per folder (per R-007), updating each card's `health` field as results arrive; call `runHealthChecks()` after `loadFolders()` resolves
- [x] T018 [US2] Update `src/renderer/components/FolderCard.tsx` to render health badge: `checking` → spinner, `ok` → green badge, `stale` → yellow badge, `unknown` → grey badge (using shadcn/ui `Badge` variants)

**Checkpoint**: All four health states render correctly. SC-002 (< 2 s per folder) verified manually.

---

## Phase 5: User Story 3 — Rescan Folder from Detail (Priority: P3)

**Goal**: Rescan button in FolderDetailView opens ImportDrawer at the confirm/preview step (step 2) with the folder path pre-loaded, skipping directory selection. After rescan, health badge updates to `ok`.

**Independent Test**: Open a stale folder's detail view → click "Rescan" → ImportDrawer opens at confirm step with path pre-filled → complete scan → health badge updates to green.

- [x] T019 [US3] Add `importRescanMode: boolean` (default `false`) and `openRescanDrawer(folderPath: string)` action to `src/renderer/store.ts`; `openRescanDrawer` sets `importRescanMode = true`, `importInitialDir = folderPath`, and opens the import drawer (per R-004)
- [x] T020 [US3] Update `src/renderer/components/ImportDrawer.tsx` to support rescan mode: when `importRescanMode === true`, mount the drawer directly at the `confirm` step (skip the `detecting` step), hide the directory picker UI, reset `importRescanMode` on close or cancel
- [x] T021 [US3] Implement Rescan button in `src/renderer/components/FolderDetailView.tsx` that calls `openRescanDrawer(folder.path)` from the store
- [x] T022 [US3] Re-trigger health check for the active folder after rescan completes in `src/renderer/store.ts`: listen for scan completion event and call `runHealthChecks()` (or a single-folder health check) to update the badge (SC-004)

**Checkpoint**: Full rescan flow works end-to-end. US3 acceptance scenarios pass.

---

## Phase 6: CLI Parity

**Purpose**: Expose `list` and `health` sub-commands so every capability available in the UI is also accessible from the CLI (Principle II — Dual-Surface Parity).

- [x] T023 [P] Create `src/cli/commands/folders.ts` with `list` subcommand (prints all scanned folders as a table) and `health <path-or-id>` subcommand (runs healthCheck and prints status)
- [x] T024 Register `folders` command in `src/cli/index.ts`

**Checkpoint**: `dashcam folders list` and `dashcam folders health <id>` work from the terminal.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Unit tests, final validation, and benchmark.

- [x] T025 [P] Write unit tests for hash algorithm (determinism, order-independence) and health check state logic in `tests/unit/folders.test.ts`
- [x] T026 Run `make check` — lint + typecheck + full test suite (all must pass)
- [ ] T027 Validate all items in the acceptance checklist at `specs/004-folder-browser/quickstart.md` and add health-check benchmark result (500+ clips, must be < 2000 ms) to the PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001–T004 — BLOCKS all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 completion — no other story dependencies
- **Phase 4 (US2)**: Depends on Phase 2 + T012 (FolderCard exists) — adds to existing card
- **Phase 5 (US3)**: Depends on Phase 2 + T013 (FolderDetailView exists) — adds rescan button
- **Phase 6 (CLI)**: Depends on Phase 2 (core module) — fully independent of UI phases
- **Phase 7 (Polish)**: Depends on all prior phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Can start after Phase 2 — extends T012/FolderCard; US1 should be complete first for best UX
- **US3 (P3)**: Can start after Phase 2 — extends T013/FolderDetailView; US1 should be complete first

### Parallel Opportunities Within Each Phase

- **Phase 1**: T003 and T004 can run in parallel (different files)
- **Phase 3**: T008, T012, T013 can start in parallel once T011 (store types) is done
- **Phase 6**: T023 can run in parallel with any UI phase after Phase 2 completes

---

## Parallel Example: User Story 1

```bash
# After T011 (store types defined), launch in parallel:
Task T012: "Create FolderCard.tsx with name, counts, last scan, delete menu"
Task T013: "Create FolderDetailView.tsx with filtered trip list and back button"
Task T008: "Create src/main/ipc/folders.ts with list and remove handlers"

# Then sequentially:
Task T009: "Register in src/main/ipc/index.ts"
Task T010: "Expose via src/preload/index.ts"
Task T014: "Update Library.tsx to wire everything together"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational — T005 RED → T006 GREEN → T007 scanner integration
3. Complete Phase 3: US1 (T008–T014)
4. **STOP and VALIDATE**: Two-level Library navigation works, empty state works, delete works
5. Continue with Phase 4 (health badges), Phase 5 (rescan), Phase 6 (CLI)

### Incremental Delivery

1. Setup + Foundational → Core module tested and scanner integrated
2. US1 → Folder grid + detail navigation (MVP demo-ready)
3. US2 → Live health badges (actionable grid)
4. US3 → Rescan flow (feedback loop complete)
5. CLI → Dual-surface parity met
6. Polish → All checks pass, PR ready

---

## Summary

| Phase | Tasks | User Story | Parallelizable |
|-------|-------|------------|----------------|
| Phase 1: Setup | T001–T004 | — | T003, T004 |
| Phase 2: Foundational | T005–T007 | — | — |
| Phase 3: US1 (P1) | T008–T014 | US1 | T008, T012, T013 |
| Phase 4: US2 (P2) | T015–T018 | US2 | — |
| Phase 5: US3 (P3) | T019–T022 | US3 | — |
| Phase 6: CLI | T023–T024 | — | T023 |
| Phase 7: Polish | T025–T027 | — | T025 |
| **Total** | **27 tasks** | | |

## Notes

- T005 MUST fail before T006 begins (contract-first per Principle IV)
- T007 requires finding the exact hook point in the scanner — read the scanner source before editing
- T014 is the most complex task — it wires together store, components, sort, and empty state
- T020 requires reading `ImportDrawer.tsx` before editing to understand existing step state machine
- Health badge color mapping: `ok` → green, `stale` → yellow/amber, `unknown` → grey, `checking` → spinner
- Commit after each task or logical group; include benchmark result in PR description (T027)
