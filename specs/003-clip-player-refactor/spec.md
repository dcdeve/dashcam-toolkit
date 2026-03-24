# Feature Specification: Modular Video Player — ClipPlayer, TripPlayer, ClipPlayerModal

**Feature Branch**: `003-clip-player-refactor`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "Refactor video player into ClipPlayer pure component, TripPlayer orchestrator, and ClipPlayerModal for playing individual clips from the library"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Play a Trip (Priority: P1)

A user browses the Library, selects a trip, and is taken to the Trip Player. They can play, pause, seek across all clips in the trip, navigate clips via the filmstrip, adjust volume, and export. The trip duration, metadata, and clip count are visible in the sidebar.

**Why this priority**: This is the existing core playback flow. It must keep working exactly as before after the refactor, and it is the most-used path in the application.

**Independent Test**: Open the app with existing trips, click a trip card, verify full playback with filmstrip and metadata sidebar.

**Acceptance Scenarios**:

1. **Given** a trip is selected, **When** the Trip Player loads, **Then** the first clip is ready to play, the filmstrip shows all clips, and the metadata sidebar shows date, duration, clip count, resolution, codec status, and folder path.
2. **Given** the trip is playing clip N, **When** clip N ends, **Then** playback continues seamlessly into clip N+1 without a visible gap or black flash.
3. **Given** the trip player is open, **When** the user clicks a clip thumbnail in the filmstrip, **Then** playback jumps to the beginning of that clip.
4. **Given** the trip player is open, **When** the user clicks anywhere on the progress bar, **Then** playback seeks to the corresponding time across the full trip duration.
5. **Given** the trip is playing, **When** the user presses play/pause, **Then** playback toggles and the control icon updates accordingly.
6. **Given** the trip player is open, **When** the user clicks Export, **Then** the export drawer opens with the current trip context intact.

---

### User Story 2 — Play a Single Clip from the Library (Priority: P2)

A user is in the Library on the Clips tab. They click a clip card and a modal opens with just the video player — no trip metadata, no filmstrip. They can watch the clip, control playback and volume, and close the modal when done.

**Why this priority**: Currently it is impossible to preview individual clips. This is a significant gap: users import footage and cannot verify clips without leaving the app. This unblocks a core workflow for reviewing dashcam footage clip-by-clip.

**Independent Test**: Switch to the Clips tab in Library, click any clip card, verify a modal opens with the video playing, and that closing the modal returns to the library.

**Acceptance Scenarios**:

1. **Given** the user is on the Clips tab, **When** they click a clip card, **Then** a modal opens and the clip begins loading for playback.
2. **Given** the clip modal is open, **When** the user clicks the close button or presses Escape, **Then** the modal closes, playback stops, and the library is visible and unchanged.
3. **Given** the clip modal is open, **When** the user interacts with play/pause, seek, and volume controls, **Then** those controls behave identically to the trip player controls.
4. **Given** the clip has reached its end, **When** playback finishes, **Then** the video pauses at the last frame and the modal remains open.
5. **Given** the clip modal is open, **When** the user uses the fullscreen control, **Then** the video expands to fullscreen and returns to modal view on exit.

---

### User Story 3 — Consistent Playback Controls Across Contexts (Priority: P3)

Regardless of whether the user is watching a full trip or a single clip, the playback controls (play/pause, seek bar, volume, fullscreen) look and behave identically.

**Why this priority**: Consistency reduces learning cost and prevents user confusion. A user who learns the trip player controls should feel immediately at home in the clip modal.

**Independent Test**: Compare the playback control UI in the trip player and in the clip modal side by side; both must render the same control surface with identical behavior.

**Acceptance Scenarios**:

1. **Given** a trip player and a clip modal are both opened (at different times), **When** comparing their control areas, **Then** the play/pause button, seek bar, time display, volume control, and fullscreen button are visually and functionally identical.
2. **Given** either playback context, **When** the user moves the mouse away from the video while it is playing, **Then** the controls fade out after 3 seconds and reappear immediately on mouse movement.

---

### Edge Cases

- What happens when a clip file is missing or unreadable? The player shows a clear error message instead of a blank screen.
- What happens when the trip has only one clip? The filmstrip shows a single item; clip-advance at end of playback is a no-op.
- What happens when the clip modal is closed while the clip is playing? Playback stops immediately — no audio continues in the background.
- What happens if the media server is not yet ready when the player loads? The player shows a loading state rather than failing silently.
- What happens when a trip has clips with different resolutions or aspect ratios? The video area adapts to each clip's dimensions without breaking the layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The video playback surface MUST support playing a sequence of one or more video clips as a continuous stream, handling transitions between clips without a user-visible interruption.
- **FR-002**: The playback surface MUST provide controls for play, pause, seek (by clicking the progress bar), volume adjustment, mute toggle, and fullscreen.
- **FR-003**: The playback controls MUST auto-hide after 3 seconds of mouse inactivity during playback and reappear immediately on any mouse movement.
- **FR-004**: The progress bar MUST visually indicate the current playback position relative to the total duration of all clips, and MUST show visual dividers at clip boundaries when there are multiple clips.
- **FR-005**: The playback surface MUST preload the next clip while the current clip is playing, to eliminate gaps at clip transitions.
- **FR-006**: The Trip Player MUST display a filmstrip of all clips in the trip, with the currently playing clip visually highlighted.
- **FR-007**: Clicking a clip in the filmstrip MUST jump playback to the beginning of that clip.
- **FR-008**: The Trip Player MUST display a metadata sidebar showing: date, start time, total duration, clip count, resolution, codec status, and folder path.
- **FR-009**: The Trip Player MUST keep the global current-time state synchronized during playback so that the Export feature has accurate context.
- **FR-010**: The Clip Modal MUST open when the user clicks any clip card in the Library Clips tab.
- **FR-011**: The Clip Modal MUST stop playback and close when the user dismisses it (via close button or Escape key), with audio stopping within 200ms of close.
- **FR-012**: The Clip Modal MUST NOT display a filmstrip or metadata sidebar — only the video and its playback controls.
- **FR-013**: When a video cannot be loaded or played, the player MUST display a visible error message within 3 seconds rather than showing a blank screen.

### Key Entities

- **ClipPlayer**: The self-contained playback surface. Accepts a list of one or more clips and optional callbacks for time and clip-index changes. Manages all playback state internally. Obtains the media server address on mount.
- **TripPlayer**: The full trip playback screen. Loads clip data from the system, renders ClipPlayer alongside the filmstrip and metadata sidebar, and bridges playback position events to the global application state for Export.
- **ClipPlayerModal**: A lightweight overlay that wraps ClipPlayer for single-clip viewing. Opened from the Library Clips tab; has no filmstrip or sidebar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing trip playback acceptance scenarios pass after the refactor — zero regressions in trip playback.
- **SC-002**: Users can open and begin watching any individual clip from the Library Clips tab within 2 interactions (click clip card → modal opens).
- **SC-003**: Clip transitions within a trip are seamless: no visible black frame or audio gap lasting more than 100ms.
- **SC-004**: Closing the clip modal stops audio within 200ms — no background audio leak.
- **SC-005**: Playback controls in the trip player and clip modal are visually indistinguishable — same layout, same icons, same interactions.
- **SC-006**: The player displays a user-visible error state within 3 seconds when a clip file cannot be loaded.

## Assumptions

- The media server is already running when any player component mounts; it is a singleton process started by the application on launch.
- Clip metadata (path, duration, dimensions) is already available in the application store before playback; no additional data fetch is needed at playback time beyond the video stream itself.
- The Library Clips tab already lists all imported clips; this feature adds playback capability without changing how clips are listed or sorted.
- Clip cards in the Library Clips tab currently have no click-to-play behavior; this feature wires that interaction up.
- The Export workflow depends on the global current-time state from the Trip Player; the Clip Modal does not need to update global state because exporting individual clips is not in scope for this feature.
- Fullscreen is handled natively by the operating system/browser on the video container element.
