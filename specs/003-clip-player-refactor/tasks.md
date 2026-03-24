# Tasks: Modular Video Player — ClipPlayer, TripPlayer, ClipPlayerModal

**Input**: Design documents from `/specs/003-clip-player-refactor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Tests**: No new test files — no new `src/interfaces/` contracts. Existing 189 tests validate regressions.

**Organization**: Tasks grouped by user story (P1 → P2 → P3). Phase 2 (ClipPlayer creation) blocks all user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story from spec.md (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Confirm baseline before refactoring. Zero configuration changes needed — no new dependencies, no DB migrations, no new IPC channels.

- [ ] T001 Verify baseline passes: run `make test` and confirm 189/189 tests pass on current branch

---

## Phase 2: Foundational — Create ClipPlayer (blocks US1 and US2)

**Purpose**: Extract the video playback surface from TripPlayer into a self-contained `ClipPlayer` component. This is the prerequisite that enables both the TripPlayer refactor (US1) and ClipPlayerModal (US2).

**⚠️ CRITICAL**: No US1 or US2 work can begin until this phase is complete.

- [ ] T002 Create `src/renderer/components/ClipPlayer.tsx` with TypeScript props interface (`ClipPlayerProps`: clips, activeClipIndex?, volume?, onTimeChange?, onClipChange?) and all state/ref declarations (currentClipIndex, isPlaying, currentTime, activeBuffer, controlsVisible, mediaPort; videoRefA, videoRefB, activeBufferRef, clipsRef, currentClipIndexRef, isAutoAdvanceRef, pendingSeekRef, hideTimerRef, progressRef, videoContainerRef). Helper getters: getVideo, getActiveVideo, getInactiveVideo.

- [ ] T003 Add `mediaPort` fetch effect to `src/renderer/components/ClipPlayer.tsx` — `useEffect(() => { window.api.media.getPort().then(setMediaPort) }, [])`. Add buffer-sync effect `useEffect([currentClipIndex, clips, mediaPort])` that: (1) skips if mediaPort===0 or clips empty, (2) skips active buffer load when isAutoAdvanceRef is true (auto-advance already playing), (3) loads current clip into active buffer, applies pendingSeek on loadedmetadata, plays if isPlaying, (4) preloads next clip into inactive buffer if src differs.

- [ ] T004 Add all video event handlers to `src/renderer/components/ClipPlayer.tsx`: `handleVideoTimeUpdate(buf)` (reports cumulative time via onTimeChange), `handleVideoPlay(buf)` (setIsPlaying true), `handleVideoPause(buf)` (setIsPlaying false), `handleVideoEnded(buf)` (swap buffers, set isAutoAdvanceRef, play next buffer, call onClipChange with new index, handle last clip stop). All handlers guard on `buf !== activeBufferRef.current` and are no-ops for the inactive buffer.

- [ ] T005 Add playback control handlers to `src/renderer/components/ClipPlayer.tsx`: `handlePlayPause` (toggle play/pause on active video), `handleSeek(e)` (click-on-progress-bar → compute position → seek within clip or across clip boundary via pendingSeekRef + setCurrentClipIndex), `handleMouseMove` (show controls, reset 3s hide timer), `handleMouseLeave` (hide if playing). Add volume sync `useEffect([volume])` that sets volume on both video refs.

- [ ] T006 Add `activeClipIndex` prop sync effect to `src/renderer/components/ClipPlayer.tsx` — `useEffect([activeClipIndex])`: if activeClipIndex is defined AND differs from currentClipIndexRef.current, update currentClipIndex state (which triggers the buffer-sync effect). Add unmount cleanup effect that pauses and clears src on both video elements.

- [ ] T007 Add full render JSX to `src/renderer/components/ClipPlayer.tsx`: `renderVideoBuffer(buf)` helper (video element with event handlers, hidden when not active buffer). Main return: container div with `onMouseMove`/`onMouseLeave`, two video buffers, play/pause click overlay, floating controls overlay (gradient backdrop, progress bar with clip separator markers and scrubber thumb, control bar with play/pause button + `formatTime(currentTime)/formatTime(totalDuration)` + clip badge + volume mute button + Slider + Expand button for fullscreen). Controls fade with `controlsVisible || !isPlaying`. Export `ClipPlayer` as named export.

**Checkpoint**: `ClipPlayer` component is complete and self-contained. TripPlayer and Library still work unchanged (ClipPlayer is not yet used). Run `make test` — all 189 pass.

---

## Phase 3: User Story 1 — Play a Trip (Priority: P1) 🎯 MVP

**Goal**: Refactor TripPlayer to use ClipPlayer internally, removing all video logic from TripPlayer while preserving identical behavior: trip header, filmstrip navigation, metadata sidebar, seamless clip advance, export integration.

**Independent Test**: Open the app, click any trip card → TripPlayer opens → play/pause, filmstrip click, seek, volume, auto-advance between clips, Export button all work as before.

- [ ] T008 [US1] Strip all video logic from `src/renderer/pages/TripPlayer.tsx`: remove `activeBuffer` state, `videoRefA/B`, `activeBufferRef`, `clipsRef`, `currentClipIndexRef`, `isAutoAdvanceRef`, `pendingSeekRef`, `hideTimerRef`, `progressRef`, `videoContainerRef`. Remove `getVideo`/`getActiveVideo`/`getInactiveVideo` helpers. Remove `mediaPort` fetch effect, buffer-sync effect, volume sync effect. Remove `handleVideoTimeUpdate`, `handleVideoPlay`, `handleVideoPause`, `handleVideoEnded`, `handlePlayPause`, `handleSeek`, `handleMouseMove`, `handleMouseLeave`, `renderVideoBuffer`, `separators` computation. Remove store selectors `currentClipIndex`, `setCurrentClipIndex`, `isPlaying`, `setIsPlaying`. Remove imports that are no longer needed (Pause, Play, Volume2, VolumeX, Slider, Expand, Badge, cn, formatTime from this file).

- [ ] T009 [US1] Add replacement state and bridge functions to `src/renderer/pages/TripPlayer.tsx`: local `activeClipIndex` state (replaces store currentClipIndex), `handleTimeChange = (t: number) => setCurrentTime(t)` (bridges to store for Export), `handleClipChange = (i: number) => setActiveClipIndex(i)` (keeps filmstrip in sync). Keep reading `volume` and `setCurrentTime` from store. Update filmstrip `handleClipClick` to call `setActiveClipIndex(index)` instead of store setter.

- [ ] T010 [US1] Replace the video area section in `src/renderer/pages/TripPlayer.tsx` with `<ClipPlayer clips={clips} activeClipIndex={activeClipIndex} volume={volume} onTimeChange={handleTimeChange} onClipChange={handleClipChange} />`. Remove the `<div ref={videoContainerRef}>` wrapper and all its children (buffers, play overlay, controls overlay, filmstrip). Keep the outer `<div className="flex min-h-0 flex-1 flex-col bg-background">` wrapping ClipPlayer + filmstrip.

- [ ] T011 [US1] Update filmstrip section in `src/renderer/pages/TripPlayer.tsx` to use local `activeClipIndex` for the active-clip highlight (replace store `currentClipIndex`). Update `totalDuration` derivation: use `selectedTrip.duration` as before. Update `progress` to use store `currentTime` (still provided via onTimeChange bridge). Add import for `ClipPlayer` from `@/components/ClipPlayer`. Fix `formatTime` import — ensure it comes from store or inline. Confirm TypeScript compiles: `npx tsc --noEmit`.

**Checkpoint**: US1 complete. Trip playback with filmstrip, metadata sidebar, and export works identically to before. Run `make test` — 189 pass. Manual test: play a trip through 3 clips, confirm filmstrip highlights update, no black frame between clips.

---

## Phase 4: User Story 2 — Play a Single Clip from the Library (Priority: P2)

**Goal**: Add ClipPlayerModal and wire it up from the Library's Clips tab so users can click any clip card to open a video player modal.

**Independent Test**: Switch to Clips tab in Library → click a clip card → modal opens and clip plays → Escape or X closes the modal and stops audio.

- [ ] T012 [P] [US2] Create `src/renderer/components/ClipPlayerModal.tsx`: props `{ clip: UIClip | null; open: boolean; onClose: () => void }`. Read `volume` from `useAppStore()`. Return a `<Dialog open={open} onOpenChange={(o) => !o && onClose()}>` containing `<DialogContent className="max-w-4xl p-0 overflow-hidden">` with `{open && clip && <ClipPlayer clips={[clip]} volume={volume} />}`. Import Dialog primitives from `@/components/ui/dialog`, ClipPlayer from `@/components/ClipPlayer`, UIClip from `@/store`, useAppStore from `@/store`. Export as named export `ClipPlayerModal`.

- [ ] T013 [P] [US2] Add clip modal state to `src/renderer/pages/Library.tsx`: `const [selectedClip, setSelectedClip] = useState<UIClip | null>(null)` and `const [isClipModalOpen, setIsClipModalOpen] = useState(false)`. Add handler `const handlePlayClip = (clip: UIClip) => { setSelectedClip(clip); setIsClipModalOpen(true); }`. Import `useState` if not already imported. Import `UIClip` from `@/store`.

- [ ] T014 [US2] Render `<ClipPlayerModal>` in `src/renderer/pages/Library.tsx`: add `<ClipPlayerModal clip={selectedClip} open={isClipModalOpen} onClose={() => setIsClipModalOpen(false)} />` at the bottom of the Library return, outside any conditional rendering. Update the `<ClipGrid clips={filteredClips} onPlay={handlePlayClip} />` call to pass the handler (cast filteredClips to `UIClip[]` consistently). Import `ClipPlayerModal` from `@/components/ClipPlayerModal`.

- [ ] T015 [P] [US2] Update `src/renderer/components/ClipGrid.tsx` to type `onPlay` as `(clip: UIClip) => void` (or keep existing Clip type and cast in Library). Ensure `onPlay?.(clip)` is called in ClipCard's onClick. Update ClipCard's `onClick` prop to pass the clip object. Import `UIClip` from `@/store` if switching types. No visual changes to ClipGrid.

**Checkpoint**: US2 complete. Clips tab → click clip → modal opens → plays → Escape closes and audio stops. Run `make test` — 189 pass. Manual test: open modal, let it play, close it, confirm no audio after close.

---

## Phase 5: User Story 3 — Consistent Playback Controls (Priority: P3)

**Goal**: Controls look and behave identically across TripPlayer and ClipPlayerModal — guaranteed by both using ClipPlayer. Only remaining work: migrate ClipCard visual style to match the rest of the design system.

**Independent Test**: Open a trip player and a clip modal (at different times) — control bar layout, icons, and interactions are identical.

- [ ] T016 [US3] Rewrite `src/renderer/components/ClipCard.tsx` using Tailwind CSS and shadcn/ui patterns (replace all inline style objects with Tailwind class strings). Preserve layout: thumbnail area (h-28 relative, film icon placeholder, duration badge bottom-right), info area (filename truncated, metadata line with resolution × size × codec). Use `cn()` for conditional classes (hover state). Use `cursor-pointer` hover effect via Tailwind `group` or direct hover classes. No behavior change — onClick prop unchanged.

**Checkpoint**: US3 complete. ClipCard visually matches TripCard and Library list items. All three user stories independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Remove now-unused player state entries from `src/renderer/store.ts`: `currentClipIndex`, `setCurrentClipIndex`, `isPlaying`, `setIsPlaying` state + actions + their Zustand implementation. Also remove from `AppState` interface and `create()` body. Verify no remaining imports/uses after TripPlayer refactor (`grep -r "currentClipIndex\|setCurrentClipIndex\|isPlaying\|setIsPlaying" src/`).

- [ ] T018 Run `make test` — confirm all 189 tests pass on the completed refactor.

- [ ] T019 Manual performance benchmark: open a trip with ≥3 clips, play through clip N end and observe transition to clip N+1. Confirm no visible black frame (dual-video-swap gap < 100ms per Constitution V budget). Document result in PR description before merge.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS US1 and US2**
- **US1 (Phase 3)**: Depends on Phase 2 (needs ClipPlayer)
- **US2 (Phase 4)**: Depends on Phase 2 (needs ClipPlayer) — can run in parallel with US1 if staffed
- **US3 (Phase 5)**: Depends on Phase 2 (visual consistency is inherent once ClipPlayer is shared) — can overlap with Phase 3/4
- **Polish (Phase 6)**: Depends on Phase 3 + 4 + 5 complete

### User Story Dependencies

- **US1 (P1)**: Requires Phase 2 only — no dependency on US2 or US3
- **US2 (P2)**: Requires Phase 2 only — no dependency on US1 (but ClipPlayerModal is simpler to write after seeing ClipPlayer in use in TripPlayer)
- **US3 (P3)**: Requires Phase 2 only — ClipCard migration is fully independent

### Within Phase 3 (US1 — TripPlayer)

```
T008 (strip TripPlayer) → T009 (add bridges) → T010 (add ClipPlayer JSX) → T011 (fix filmstrip + imports)
```

### Within Phase 4 (US2 — Modal + Library)

```
T012 [P] ClipPlayerModal.tsx  ─┐
T013 [P] Library.tsx state    ─┼─→ T014 Library.tsx render modal
T015 [P] ClipGrid.tsx prop    ─┘    (depends on T012 + T013)
```

T012, T013, T015 can all start simultaneously (different files, no shared dependencies).

---

## Parallel Example: Phase 4 (US2)

```bash
# All three can start at the same time:
Task T012: "Create ClipPlayerModal.tsx with Dialog + conditional ClipPlayer"
Task T013: "Add selectedClip/isClipModalOpen state to Library.tsx"
Task T015: "Update ClipGrid.tsx to forward onPlay prop"

# Only after T012 + T013 complete:
Task T014: "Render ClipPlayerModal and wire ClipGrid in Library.tsx"
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1 + 2 + 3)

1. Complete Phase 1: baseline check
2. Complete Phase 2: ClipPlayer (foundational, blocks everything)
3. Complete Phase 3: TripPlayer refactor (US1)
4. **STOP and VALIDATE**: Trip playback works identically, 189 tests pass
5. Demo if ready — this is a working, non-regressing state

### Incremental Delivery

1. Phase 1 + 2: Foundation → ClipPlayer exists
2. Phase 3: US1 → Trip playback refactored
3. Phase 4: US2 → Clip modal added (new user capability)
4. Phase 5: US3 → Visual consistency (ClipCard)
5. Phase 6: Polish → Store cleanup + benchmark
6. Each phase adds value without breaking previous phases

---

## Notes

- [P] tasks = different files, truly parallel (no file conflicts)
- No new test files — all validation via existing 189 tests + manual checks
- Constitution V performance budget: dual-video-swap < 100ms — must be confirmed in T019 before merge
- The `formatTime` import in TripPlayer (T011) may need to be moved from TripPlayer's inline use to a store import — check existing usage
- `ClipCard.tsx` currently uses raw Clip type from interfaces; verify type alignment with UIClip in ClipGrid (T015) before finalizing cast strategy in Library
