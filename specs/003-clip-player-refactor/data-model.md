# Data Model: 003-clip-player-refactor

**Phase**: 1 — Design
**Date**: 2026-03-24

---

## Database Changes

**None.** This feature is a pure renderer-layer refactor. No new tables, columns, or migrations are required. The `UIClip` and `UITrip` view-models defined in `src/renderer/store.ts` are used as-is.

---

## Component Interfaces

### ClipPlayer

```tsx
interface ClipPlayerProps {
  /** Ordered list of clips to play. One clip = single clip mode (modal). */
  clips: UIClip[];

  /**
   * External clip index override. When this value changes and differs from
   * the internal currentClipIndex, ClipPlayer seeks to that clip.
   * Used by TripPlayer's filmstrip. Ignored by ClipPlayerModal (single clip).
   */
  activeClipIndex?: number;

  /** Volume level 0–1. Parent reads from global store and passes down. */
  volume?: number;

  /**
   * Called on every timeupdate with the cumulative trip time (seconds).
   * TripPlayer uses this to sync global store for Export.
   * ClipPlayerModal ignores it (no export surface).
   */
  onTimeChange?: (time: number) => void;

  /**
   * Called when the active clip changes — either via auto-advance or
   * external seek. TripPlayer uses this to keep its filmstrip in sync.
   */
  onClipChange?: (index: number) => void;
}
```

**Internal state** (not exposed via props):
- `currentClipIndex: number` — owns clip navigation, syncs from `activeClipIndex` prop when different
- `isPlaying: boolean`
- `currentTime: number` — cumulative trip time (seconds), derived from clip offsets + video.currentTime
- `activeBuffer: 'a' | 'b'` — double-buffer swap
- `controlsVisible: boolean` — auto-hide timer
- `mediaPort: number` — fetched once on mount via `window.api.media.getPort()`

**Refs** (not state, used inside event handlers):
- `videoRefA`, `videoRefB` — the two `<video>` elements
- `activeBufferRef` — mirror of `activeBuffer` state for use in event handlers
- `clipsRef` — mirror of `clips` prop for use in event handlers
- `currentClipIndexRef` — mirror of `currentClipIndex`
- `isAutoAdvanceRef` — flag to skip re-load when auto-advancing
- `pendingSeekRef` — time-within-clip to seek to after metadata loads
- `hideTimerRef` — auto-hide controls timer

---

### TripPlayer (refactored)

No new props. TripPlayer continues to consume `selectedTrip` from Zustand. Internal state changes:

```tsx
// New local state — was previously read from global store
const [clips, setClips] = useState<UIClip[]>([]);
const [activeClipIndex, setActiveClipIndex] = useState(0);

// Callbacks passed to ClipPlayer
const handleTimeChange = (t: number) => setCurrentTime(t);      // → store
const handleClipChange = (i: number) => setActiveClipIndex(i);  // → local (filmstrip)
```

---

### ClipPlayerModal

```tsx
interface ClipPlayerModalProps {
  clip: UIClip | null;  // null = closed
  open: boolean;
  onClose: () => void;
}
```

Internal: reads `volume` from Zustand store to pass to ClipPlayer. Renders:

```tsx
<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
  <DialogContent className="max-w-4xl p-0 overflow-hidden">
    {/* Unmounts ClipPlayer immediately on close → stops audio */}
    {open && clip && (
      <ClipPlayer
        clips={[clip]}
        volume={volume}
      />
    )}
  </DialogContent>
</Dialog>
```

---

## State Flow Diagram

```
Library (Clips tab)
  └── ClipCard onClick
        └── sets selectedClip + openModal = true
              └── ClipPlayerModal(clip, open=true)
                    └── ClipPlayer(clips=[clip], volume)
                          internal: currentClipIndex, isPlaying, currentTime
                          onTimeChange → (not used)
                          onClipChange → (not used, single clip)


Library (Trips tab) → TripCard click → page = 'player'
  └── TripPlayer
        ├── IPC: getClips(trip.id) → clips[]
        ├── local: activeClipIndex (filmstrip selection)
        ├── global store: setCurrentTime (for Export)
        │
        ├── <header> (trip name, export button)
        ├── <ClipPlayer
        │     clips={clips}
        │     activeClipIndex={activeClipIndex}
        │     volume={volume}            ← from store
        │     onTimeChange={→ store}
        │     onClipChange={→ setActiveClipIndex}
        │   />
        ├── <filmstrip> (uses activeClipIndex for highlight)
        └── <metadata sidebar>
```

---

## Files Affected

| File | Change |
|------|--------|
| `src/renderer/components/ClipPlayer.tsx` | **New** — extracted from TripPlayer |
| `src/renderer/components/ClipPlayerModal.tsx` | **New** |
| `src/renderer/pages/TripPlayer.tsx` | **Modified** — uses ClipPlayer, removes video logic |
| `src/renderer/pages/Library.tsx` | **Modified** — state for selectedClip + modal open |
| `src/renderer/components/ClipGrid.tsx` | **Modified** — passes onPlay to ClipCard |
| `src/renderer/components/ClipCard.tsx` | **Modified** — migrated to Tailwind/shadcn styles |
| `src/renderer/store.ts` | **No change** — UIClip/UITrip unchanged |
| `src/interfaces/` | **No change** — no new core interfaces |
| `tests/contracts/` | **No change** — no new core interfaces |
