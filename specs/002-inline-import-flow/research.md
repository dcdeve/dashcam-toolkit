# Research: Inline Import Flow

**Phase**: 0 | **Date**: 2026-03-20 | **Feature**: `002-inline-import-flow`

## Summary

This feature is a pure renderer-layer refactor. All APIs, UI primitives, and state patterns already exist in the codebase. No external research was required; findings below document what was discovered by reading existing code.

---

## Finding 1 — Drawer Pattern

**Decision**: Use `Sheet` / `SheetContent` from shadcn/ui (side-panel variant) for the import overlay.

**Rationale**: `ExportDrawer.tsx` already uses `Sheet`/`SheetContent` (`src/renderer/components/ExportDrawer.tsx:15`). Reusing the same primitive keeps visual language consistent and avoids introducing a new dependency (e.g., Vaul, Radix Dialog).

**Alternatives considered**:
- Full Radix `Dialog` (center modal) — rejected; a drawer keeps more Library context visible as stated in the spec preference.
- Custom overlay div — rejected; shadcn/ui Sheet handles focus trap, ESC dismiss, and animation out of the box.

---

## Finding 2 — State Machine

**Decision**: Lift the `useReducer` state machine verbatim from `ImportFlow.tsx` into `ImportDrawer.tsx`.

**Rationale**: The reducer in `ImportFlow.tsx` (lines 6–49) already models all required states: `idle → detecting → confirm → scanning → done | error`. Moving it to `ImportDrawer` with no structural changes satisfies the spec and Principle VI (YAGNI).

**Alternatives considered**:
- Moving state to Zustand store — rejected; import state is ephemeral/UI-only and does not need to survive component unmount beyond the overlay's lifetime.
- Introducing a new core module — rejected; all business logic lives in core (scanner, patterns) already. The reducer is purely UI coordination.

---

## Finding 3 — Folder Picker Invocation Point

**Decision**: Call `window.api.dialog.openDirectory()` directly in the `Library.tsx` "Scan folder" button `onClick` handler (before the drawer opens), then pass the selected directory as initial state to `ImportDrawer`.

**Rationale**: The spec requires "clicking Scan folder opens the OS folder picker immediately — no intermediate screen." Calling the picker from the button click and only opening the Sheet if a directory is selected avoids showing an empty/idle drawer step.

**Alternatives considered**:
- Open the Sheet first (idle step), then have a picker button inside — rejected; adds an extra click and contradicts FR-001/SC-001.
- Store the selected dir in Zustand then open the drawer — rejected; unnecessary state coupling. A local callback (`onFolderSelected: (dir: string) => void`) passed from Library to ImportDrawer keeps it simple.

**Implementation approach**: `Library.tsx` button onClick:
```ts
async function handleScanFolder(): Promise<void> {
  const dir = await window.api.dialog.openDirectory();
  if (dir) openImportDrawer(dir);  // store action sets isImportOpen=true, initialDir=dir
}
```

---

## Finding 4 — Page Type Cleanup

**Decision**: Remove `'import'` from the `Page` union in `store.ts` and replace with `isImportOpen: boolean` + `importInitialDir: string | null`.

**Rationale**: The import flow no longer needs a page-level route. Using a boolean + initial dir in the store lets `Library.tsx` and `ImportDrawer` stay decoupled — Library sets the flag, DrawerContainer reads it.

**Alternatives considered**:
- Keep `'import'` in Page enum as a no-op — rejected; dead code violates Principle VI.
- Pass dir via a React ref / context — rejected; store already provides a clean channel used by ExportDrawer for the same pattern.

---

## Finding 5 — Library Refresh on Completion

**Decision**: Call the existing `refresh()` store action when ImportDrawer dismisses after a successful scan (reusing the same `handleImportDone` pattern already in `App.tsx`).

**Rationale**: `refresh()` already exists in the store and reloads trips + clips. SC-004 requires newly imported trips to appear within 2 s of dismissal — `refresh()` does this in one call.

**Alternatives considered**:
- IPC push notification after scan — rejected; the scanner's `scan()` promise already resolves when done. No new IPC needed.

---

## Resolved Unknowns

| Item | Status |
|------|--------|
| Which drawer primitive to use | ✅ Resolved — `Sheet` (shadcn/ui), same as ExportDrawer |
| State machine location | ✅ Resolved — local `useReducer` inside ImportDrawer |
| How picker is invoked | ✅ Resolved — from Library button onClick, dir passed to drawer |
| Store changes needed | ✅ Resolved — remove `'import'` page, add `isImportOpen` + `importInitialDir` |
| Library refresh mechanism | ✅ Resolved — existing `refresh()` action |
