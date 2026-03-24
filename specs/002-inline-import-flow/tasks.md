# Tasks: Inline Import Flow

**Input**: Design documents from `/specs/002-inline-import-flow/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

**Purpose**: Pure renderer-layer refactor — no new dependencies or infrastructure needed. All primitives (Sheet, Zustand, IPC bridge) already exist. No setup tasks required; proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Store changes and dead-code removal that MUST be complete before any user story can be implemented. `App.tsx` cannot remove the `'import'` branch until the type is gone; `ImportDrawer` cannot bind to the store until the new fields exist.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Modify `src/renderer/store.ts`: remove `'import'` from the `Page` union type, add `isImportOpen: boolean`, `importInitialDir: string | null`, `openImportDrawer(dir: string): void`, and `closeImportDrawer(): void` actions — mirror the existing `isExportOpen` pattern already in the store
- [ ] T002 Delete `src/renderer/pages/ImportFlow.tsx` (replaced entirely by `ImportDrawer`)

**Checkpoint**: Store types compile cleanly with `'import'` removed. `ImportFlow.tsx` no longer exists. All other phases can now begin.

---

## Phase 3: User Story 1 — Open Folder Picker Directly From Library (Priority: P1) 🎯 MVP

**Goal**: Clicking "Scan folder" immediately opens the OS folder picker, and after folder selection an import drawer slides in over the Library — no full-page navigation.

**Independent Test**: Click "Scan folder", select a folder, verify the Library page is still visible underneath the import overlay and the drawer shows the detecting step.

### Implementation for User Story 1

- [ ] T003 [US1] Create `src/renderer/components/ImportDrawer.tsx`: define `ImportState` union, `ImportAction` union, and `importReducer` pure function (lifted verbatim from `ImportFlow.tsx`); wire `useReducer`; bind `isImportOpen`, `importInitialDir`, `closeImportDrawer`, and `refresh` from the Zustand store; render a `Sheet`/`SheetContent` that opens when `isImportOpen === true` and seeds reducer with `{ step: 'detecting', dir: importInitialDir }` via `useEffect`
- [ ] T004 [US1] Implement **detecting step** UI in `src/renderer/components/ImportDrawer.tsx`: `useEffect` on `step === 'detecting'` calls `window.api.patterns.detect(dir)`, dispatches `DETECTED` (with `pattern` and `fileCount`) on success or `ERROR` on failure; show a spinner with "Detecting files…" label during the async call
- [ ] T005 [US1] Implement **confirm step** UI in `src/renderer/components/ImportDrawer.tsx`: display detected pattern name and `fileCount`; render "Start scan" button that dispatches `CONFIRM_SCAN`; render "Cancel" button that dispatches `RESET` and calls `closeImportDrawer()`
- [ ] T006 [US1] Implement **scanning step** UI in `src/renderer/components/ImportDrawer.tsx`: `useEffect` on `step === 'scanning'` calls `window.api.scanner.scan(dir, pattern)`; listen for `PROGRESS` events and dispatch `PROGRESS` action to update UI; dispatch `SCAN_DONE` on resolve or `ERROR` on reject; display progress bar with clip count
- [ ] T007 [P] [US1] Modify `src/renderer/pages/Library.tsx`: replace the existing `handleScanFolder` handler to `await window.api.dialog.openDirectory()`; if a directory string is returned, call `openImportDrawer(dir)` from the store — no page navigation; leave the button label unchanged
- [ ] T008 [US1] Modify `src/renderer/App.tsx`: remove the `'import'` case from the page render switch/conditional; add `<ImportDrawer />` as a always-mounted sibling of the page content; ensure the Sidebar renders for all remaining page values (`library`, `player`, `settings`) so it is never hidden by the import flow

**Checkpoint**: US1 is fully functional. Clicking "Scan folder" opens the picker → drawer appears over Library → detect → confirm → scan steps all reachable.

---

## Phase 4: User Story 2 — Cancel At Any Step (Priority: P2)

**Goal**: Every step of the import flow exposes a visible cancel affordance that cleanly closes the drawer and returns the user to the Library with scroll position intact.

**Independent Test**: Open the import overlay, then cancel at each step — detecting, confirm, scanning — and verify the drawer closes and Library is visible and unchanged each time.

### Implementation for User Story 2

- [ ] T009 [US2] Wire **detecting step** cancel in `src/renderer/components/ImportDrawer.tsx`: pass `onOpenChange` to `SheetContent` so pressing ESC or the Sheet's X button calls `closeImportDrawer()` and resets local reducer state; the in-flight `detect` promise result is silently ignored after close
- [ ] T010 [P] [US2] Verify the **confirm step** Cancel button added in T005 dispatches `RESET` then calls `closeImportDrawer()` and that the Sheet closes — add integration assertion if missing; ensure no state leaks between open/close cycles
- [ ] T011 [P] [US2] Add **Cancel** button to the scanning step UI built in T006 in `src/renderer/components/ImportDrawer.tsx`: dispatches `RESET` and calls `closeImportDrawer()`; note in a comment that the underlying `scan()` promise continues to resolve in the main process (no new IPC stop channel per plan constraints)
- [ ] T012 [P] [US2] Disable the "Scan folder" button in `src/renderer/pages/Library.tsx` when `isImportOpen === true` (read from store): set `disabled={isImportOpen}` on the button to prevent concurrent invocations

**Checkpoint**: US2 is fully functional. Cancel works at every step. "Scan folder" button is protected against concurrent triggers.

---

## Phase 5: User Story 3 — Import Completes and Library Refreshes (Priority: P3)

**Goal**: After a successful import the Library automatically shows newly imported trips without requiring a manual refresh. Errors surface a clear message with retry/cancel options.

**Independent Test**: Complete a full import end-to-end, dismiss the "done" overlay, and verify new trips appear in the Library grid within 2 seconds without a manual reload.

### Implementation for User Story 3

- [ ] T013 [US3] Implement **done step** UI in `src/renderer/components/ImportDrawer.tsx`: display `ScanResult` summary (total clips imported, error count if > 0); render a "Done" button that calls `refresh()` from the store then `closeImportDrawer()`
- [ ] T014 [P] [US3] Implement **error step** UI in `src/renderer/components/ImportDrawer.tsx`: display `message` from the error state; render "Retry" button that dispatches `RESET` and calls `closeImportDrawer()` (user re-clicks "Scan folder" to pick again); render "Cancel" button that calls `closeImportDrawer()`
- [ ] T015 [US3] Handle **edge case — no videos found** in `src/renderer/components/ImportDrawer.tsx`: when `DETECTED` fires with `fileCount === 0`, transition to the `error` step with message "No videos found in this folder. Please pick a different folder." and show the Retry/Cancel buttons

**Checkpoint**: US3 is fully functional. Successful import updates the Library. Errors show actionable messages.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Unit tests for the reducer pure function, lint/type validation, and final acceptance checklist review.

- [ ] T016 [P] Create `tests/unit/importReducer.test.ts` with Vitest unit tests covering all `importReducer` state transitions: `idle → detecting` (SELECT_DIR), `detecting → confirm` (DETECTED with fileCount > 0), `detecting → error` (DETECTED with fileCount === 0 and ERROR), `confirm → scanning` (CONFIRM_SCAN), `confirm → idle` (RESET), `scanning → done` (SCAN_DONE), `scanning → error` (ERROR), `RESET` from error and done steps; import the reducer function directly from `ImportDrawer.tsx` (export it for testability)
- [ ] T017 Run `npm test && npm run lint` to confirm all Vitest tests pass and no TypeScript or ESLint errors remain
- [ ] T018 Walk through the `specs/002-inline-import-flow/quickstart.md` acceptance checklist (8 items) and confirm each item passes in the running Electron dev app (`npm run dev`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately. **BLOCKS all user stories.**
- **User Story 1 (Phase 3)**: Depends on Phase 2 (store types must exist). T007 and T008 are parallelizable with T003–T006.
- **User Story 2 (Phase 4)**: Depends on Phase 3 (cancel affordances are additive to existing step UIs). T010, T011, T012 are parallelizable with each other.
- **User Story 3 (Phase 5)**: Depends on Phase 3 (done/error steps extend the scanning step). T014 and T015 are parallelizable with each other.
- **Polish (Phase 6)**: Depends on Phase 5 completion. T016 and T017 can run in parallel.

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — no story dependencies
- **US2 (P2)**: Depends on US1 (adds cancel affordances to existing step UIs)
- **US3 (P3)**: Depends on US1 (adds done/error steps to the same component)

### Within Each User Story

- T003 (Sheet shell + reducer) must complete before T004–T006 (step UIs) and T008 (App.tsx wiring)
- T007 (Library.tsx) and T008 (App.tsx) can run in parallel after T001 (store types)
- T004, T005, T006 are sequential within ImportDrawer (detecting → confirm → scanning)

---

## Parallel Execution Examples

### Phase 3: User Story 1

```bash
# After T003 completes, these can run concurrently:
Task A: T004 — detecting step UI (ImportDrawer.tsx)
Task B: T007 — Library.tsx picker wiring (different file)

# After T004:
Task: T005 — confirm step UI
Task: T008 — App.tsx cleanup (different file, parallel with T005)

# After T005:
Task: T006 — scanning step UI
```

### Phase 4: User Story 2

```bash
# After T009, these can run concurrently (different step UIs):
Task A: T010 — confirm cancel verification (ImportDrawer.tsx confirm step)
Task B: T011 — scanning cancel button (ImportDrawer.tsx scanning step)
Task C: T012 — button disabled state (Library.tsx, different file)
```

### Phase 5: User Story 3

```bash
# After T013, these can run concurrently:
Task A: T014 — error step UI (ImportDrawer.tsx)
Task B: T015 — edge case no-videos (ImportDrawer.tsx, different function/branch)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (store changes + delete ImportFlow)
2. Complete Phase 3: User Story 1 (ImportDrawer + Library + App)
3. **STOP and VALIDATE**: Click "Scan folder" → picker → drawer appears over Library → all 3 steps reachable
4. Demo if ready

### Incremental Delivery

1. Foundational → US1 → **MVP**: picker flows inline, Library always visible
2. Add US2 → cancel works at every step → no dead ends
3. Add US3 → successful import refreshes Library → happy path complete
4. Polish → tests pass, lint clean

### Parallel Team Strategy

With two developers after Foundational completes:

- Developer A: T003 → T004 → T005 → T006 (ImportDrawer step UIs, sequential)
- Developer B: T007 + T008 (Library.tsx + App.tsx, parallel, different files)

---

## Notes

- `importReducer` must be exported from `ImportDrawer.tsx` as a named export to allow direct unit testing in `tests/unit/importReducer.test.ts`
- The `onOpenChange` Sheet prop is the primary ESC/X dismiss path — it must always call `closeImportDrawer()` regardless of current step
- Do not add a new IPC channel to stop an in-progress scan (plan constraint: must not introduce new IPC channels)
- Library scroll position is preserved automatically because the Library page remains mounted throughout — no explicit scroll restoration needed
- `[P]` tasks touch different files or non-conflicting branches of the same file — safe to run concurrently
