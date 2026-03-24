# Research: 003-clip-player-refactor

**Phase**: 0 — Pre-design research
**Date**: 2026-03-24

---

## Finding 1 — Radix Dialog mount/unmount behavior

**Decision**: Use `{open && <ClipPlayer />}` inside `DialogContent` to control lifecycle.

**Rationale**: Radix Dialog keeps `DialogContent` mounted during the closing animation (`data-[state=closed]:animate-out`). If `ClipPlayer` is always rendered inside `DialogContent`, video continues playing through the fade-out. By gating with `{open && <ClipPlayer />}`, React unmounts `ClipPlayer` immediately when `open` becomes false. The `useEffect` cleanup in `ClipPlayer` fires synchronously, pausing both video buffers. Audio stops in the same render cycle — well under the 200ms FR-011 budget. The Dialog overlay animation completes independently with no audio.

**Alternatives considered**:
- `onOpenChange` callback + imperative ref to call pause — adds ref plumbing, less clean
- `forceMount` with visibility CSS — video keeps playing in background, violates FR-011
- Removing Dialog animation — user-visible jank, worse UX

---

## Finding 2 — Controlled `activeClipIndex` without double-load

**Decision**: `ClipPlayer` owns its internal `currentClipIndex` state; `activeClipIndex` prop is an external override that fires a seek only when the value differs from internal state. Auto-advance increments internal state and reports via `onClipChange`; the parent echoes back the same index via `activeClipIndex`, which is then a no-op in ClipPlayer's effect.

**Rationale**: The existing `isAutoAdvanceRef` flag prevents the double-buffer load from re-firing when a clip advances automatically. This flag is preserved in ClipPlayer. The guard `if (activeClipIndex === currentClipIndex) return` in the effect makes the parent's echo a no-op. TripPlayer's filmstrip click path: `setActiveClipIndex(idx)` → prop changes → ClipPlayer effect fires → new clip loads. Auto-advance path: internal state updates → `onClipChange(newIdx)` → TripPlayer `setActiveClipIndex(newIdx)` → prop echoes → guard skips re-load.

**Alternatives considered**:
- Fully uncontrolled ClipPlayer with imperative `seek()` via `useImperativeHandle` — imperative API is harder to test and violates React's data-down model
- Fully controlled (parent owns `currentClipIndex`) — parent must also manage `isAutoAdvance` flag, pulling complexity out of the component that owns the video elements

---

## Finding 3 — Volume: prop vs store

**Decision**: `volume` is passed as a prop from the parent (TripPlayer reads it from store, ClipPlayerModal defaults to 1 or reads from store at the modal level).

**Rationale**: Keeping `ClipPlayer` free of Zustand dependencies makes it portable and testable. Volume is app-global preference — it belongs in the store at the page/layout level, not inside the pure video component. The prop surface is one additional field, negligible cost.

**Alternatives considered**:
- ClipPlayer calls `useAppStore()` directly for volume — couples the component to the global store, defeating the purpose of the refactor

---

## Finding 4 — `mediaPort` fetch location

**Decision**: `ClipPlayer` fetches `mediaPort` internally via a single `useEffect` on mount, calling `window.api.media.getPort()`.

**Rationale**: `mediaPort` is a runtime constant (the local media server starts once and never changes port). Fetching it inside ClipPlayer keeps the component self-sufficient; callers don't need to know about it. There is no benefit to hoisting this to the parent since it would just add prop threading for a value that never changes. Fetching on mount is safe because the media server is started before the renderer loads (see `src/main/index.ts` → `startMediaServer()`).

**Alternatives considered**:
- `mediaPort` as a required prop — forces every caller to fetch it, adds boilerplate
- App-level context provider for `mediaPort` — overkill for a single integer that never changes after boot

---

## Finding 5 — `currentTime` global store bridge

**Decision**: `TripPlayer` bridges ClipPlayer's `onTimeChange` callback to `setCurrentTime` in the global store. ClipPlayer manages `currentTime` as local state for its own progress bar rendering.

**Rationale**: The Export drawer depends on global `currentTime` to know the current playback position for range selection. ClipPlayer reports time via callback; TripPlayer decides to sync it to the store. ClipPlayerModal has no export surface, so it does not sync to global state — the local ClipPlayer state is sufficient.

**Performance note**: `onTimeChange` fires on every `timeupdate` event (~4x/sec). The callback path is: ClipPlayer `timeupdate` → `setCurrentTime` (local) → `onTimeChange(t)` → Zustand `setCurrentTime`. This is unchanged from the current behavior and well within the performance budget.
