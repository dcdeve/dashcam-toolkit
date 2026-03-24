# Quickstart: Inline Import Flow

**Feature**: `002-inline-import-flow` | **Date**: 2026-03-20

## What Changes

| File | Action | Summary |
|------|--------|---------|
| `src/renderer/store.ts` | MODIFY | Remove `'import'` from `Page`; add `isImportOpen`, `importInitialDir`, `openImportDrawer`, `closeImportDrawer` |
| `src/renderer/components/ImportDrawer.tsx` | CREATE | Sheet-based overlay with lifted reducer from ImportFlow |
| `src/renderer/pages/Library.tsx` | MODIFY | "Scan folder" button calls picker directly then `openImportDrawer(dir)` |
| `src/renderer/App.tsx` | MODIFY | Remove `import` page branch and `handleImportDone`; add `<ImportDrawer />`; Sidebar always visible |
| `src/renderer/pages/ImportFlow.tsx` | DELETE | Replaced by ImportDrawer |
| `tests/unit/importReducer.test.ts` | CREATE | Unit tests for the reducer pure function |

## Running the Feature

```bash
npm run dev          # start Electron dev server
# Click "Scan folder" in Library → OS picker opens directly → drawer appears
```

## Testing

```bash
npm test             # runs full Vitest suite including new unit tests
npm run lint         # ESLint + TypeScript check
```

## Key Design Decisions

1. **`Sheet` (not Dialog)**: Drawer slides in from the right, keeping Library visible underneath — matches spec preference and ExportDrawer visual consistency.

2. **Picker before drawer**: `Library.tsx` calls `window.api.dialog.openDirectory()` first. The drawer only opens if a directory is selected, so the idle step is invisible to users.

3. **Local reducer, not store**: `ImportState` lives inside `ImportDrawer` via `useReducer`. Only the open/close flag and initial dir are in the store — matching how `ExportDrawer` handles its own local form state.

4. **`refresh()` on done**: When the user dismisses the "done" step, `ImportDrawer` calls `refresh()` from the store — the same mechanism `App.tsx` used previously via `handleImportDone`.

## Cancellation Behavior

| Step | Cancel action | Result |
|------|--------------|--------|
| detecting | X button / ESC | Drawer closes (detecting async silently abandoned) |
| confirm | Cancel button | `RESET` → drawer closes |
| scanning | Cancel button | `RESET` → drawer closes (scan may still be running in main process; stop signal TBD per edge cases in spec) |
| done | Done button | `refresh()` called, drawer closes |
| error | Retry / Cancel | Retry → `RESET` → idle (re-pick); Cancel → drawer closes |

## Acceptance Checklist

- [ ] Clicking "Scan folder" opens the OS picker without navigating away from Library
- [ ] Selecting a folder opens the import drawer over the Library
- [ ] Canceling at every step (detecting, confirm, scanning) closes the drawer cleanly
- [ ] Successful import triggers Library refresh within 2 s of dismissal
- [ ] Empty library "Scan folder" button also triggers picker directly (not navigation)
- [ ] "Scan folder" is disabled while an import is already in progress
- [ ] `ImportFlow` page/route is unreachable
- [ ] `npm test && npm run lint` pass
