# Data Model: Inline Import Flow

**Phase**: 1 | **Date**: 2026-03-20 | **Feature**: `002-inline-import-flow`

## Overview

This feature is a renderer-layer UI refactor. No database schema changes. No new `src/interfaces/` types. The only data modeling work is:

1. The `ImportState` union (local component state in `ImportDrawer`)
2. The store slice additions/removals

---

## 1. ImportState (local to `ImportDrawer`)

This is the state machine that drives the drawer UI. Lifted verbatim from `ImportFlow.tsx` — no structural changes.

```ts
type ImportState =
  | { step: 'idle' }
  | { step: 'detecting'; dir: string }
  | { step: 'confirm'; dir: string; pattern: Pattern | null; fileCount: number }
  | { step: 'scanning'; dir: string; progress: ScanProgress | null }
  | { step: 'done'; result: ScanResult }
  | { step: 'error'; message: string };
```

### State Transitions

```
idle
  └─(open with dir)──► detecting
                          ├─(fileCount=0)──► error
                          └─(fileCount>0)──► confirm
                                               ├─(CONFIRM_SCAN)──► scanning
                                               │                       ├─(SCAN_DONE)──► done
                                               │                       └─(ERROR)──────► error
                                               └─(RESET/cancel)──► [drawer closes]
error
  └─(RESET/retry)──► idle  (picks folder again from Library button)
done
  └─(dismiss)──► [drawer closes, Library refresh triggered]
```

### ImportAction Union

```ts
type ImportAction =
  | { type: 'SELECT_DIR'; dir: string }   // used only to seed initial state from Library picker
  | { type: 'DETECTED'; pattern: Pattern | null; fileCount: number }
  | { type: 'CONFIRM_SCAN' }
  | { type: 'PROGRESS'; progress: ScanProgress }
  | { type: 'SCAN_DONE'; result: ScanResult }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };
```

**Validation rules**:
- `DETECTED` is only valid when `step === 'detecting'`; ignored otherwise.
- `CONFIRM_SCAN` is only valid when `step === 'confirm'`; ignored otherwise.
- `PROGRESS` is only valid when `step === 'scanning'`; ignored otherwise.

---

## 2. Store Changes (`store.ts`)

### Removed

```ts
// Before
export type Page = 'library' | 'player' | 'settings' | 'import';
```

### Added

```ts
// After
export type Page = 'library' | 'player' | 'settings';

// New fields in AppState
isImportOpen: boolean;
importInitialDir: string | null;
openImportDrawer: (dir: string) => void;
closeImportDrawer: () => void;
```

### Rationale

`'import'` is removed because the import flow no longer occupies a page slot. `isImportOpen` + `importInitialDir` replaces it as a lightweight overlay flag, following the same pattern as `isExportOpen` in the existing store.

---

## 3. Component Props

### `ImportDrawer` (no props)

```ts
// Reads from store:
//   isImportOpen, importInitialDir, closeImportDrawer, refresh
export function ImportDrawer(): React.ReactElement | null
```

Renders nothing when `isImportOpen === false`. When opened, seeds the reducer with `{ step: 'detecting', dir: importInitialDir }` via `useEffect`.

---

## External Types (unchanged, imported from interfaces)

These types are defined in `src/interfaces/` and consumed unchanged:

| Type | Source |
|------|--------|
| `Pattern` | `src/interfaces/patterns.ts` |
| `ScanProgress` | `src/interfaces/scanner.ts` |
| `ScanResult` | `src/interfaces/scanner.ts` |
