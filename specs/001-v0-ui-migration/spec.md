# Feature Specification: v0-UI Migration

**Feature Branch**: `001-v0-ui-migration`
**Created**: 2026-03-20
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Library: Browsing & Discovering Trips (Priority: P1)

A user opens the app and sees their trips displayed as visual cards in a grid or list.
Each card shows a thumbnail, trip date/time, duration, clip count, and a badge indicating
whether the trip can be exported losslessly or requires re-encoding. Hovering over a card
scrubs through thumbnail previews (YouTube-style). Trips from disconnected media (SD card
removed) appear visually dimmed with their last-known thumbnails still visible and action
buttons disabled. The user can search trips by name or date, sort by different criteria,
and toggle between grid and list view.

**Why this priority**: The library is the entry point and most-used screen. Without a
functional library view, no other part of the app is reachable.

**Independent Test**: Launch the app with an existing database of trips. Verify cards
render correctly, hover scrub works, disconnected trips are dimmed, search filters
results, and view toggle switches layout — all without touching the player or export.

**Acceptance Scenarios**:

1. **Given** the app has scanned trips, **When** the library opens, **Then** trips display as cards with thumbnail, name, duration badge, clip count badge, and codec indicator.
2. **Given** a trip's media device is disconnected, **When** the library renders, **Then** that trip's card appears dimmed and its action buttons are disabled with a "Device not connected" tooltip.
3. **Given** the user types in the search bar, **When** text is entered, **Then** only trips matching name or date are shown; clearing the field restores all trips.
4. **Given** the user hovers over a trip card, **When** the cursor moves across the thumbnail, **Then** the thumbnail scrubs through the trip's cached previews.
5. **Given** no trips exist in the database, **When** the library renders, **Then** an empty state is shown with a "Scan folder" call-to-action.

---

### User Story 2 - Player: Watching a Trip (Priority: P2)

A user clicks a trip card and is taken to the player view. The player shows the video
area, a seek bar spanning the full trip duration, play/pause, volume controls, a
"Clip N / Total" counter, and the dashcam timestamp overlay. Below the video, a
horizontal filmstrip shows all clips; clicking a clip jumps to it. A metadata sidebar
shows date, start time, duration, resolution, codec status, and folder path. An
"Export this trip" button is prominently available.

**Why this priority**: Playing a trip is the second most common action after browsing
and is the primary gateway to exporting.

**Independent Test**: Select a trip from the library. Verify playback controls function,
the filmstrip is scrollable and clips are selectable, the seek bar updates position,
and the metadata sidebar shows correct trip data — independently of export.

**Acceptance Scenarios**:

1. **Given** a trip is selected, **When** the player opens, **Then** the video area, controls bar, filmstrip, and metadata sidebar are all visible.
2. **Given** the player is open, **When** the user clicks a clip in the filmstrip, **Then** playback jumps to that clip and the filmstrip highlights the active clip.
3. **Given** the player is open, **When** the user clicks the seek bar at any position, **Then** the current time and active clip update accordingly.
4. **Given** the player is open, **When** "Export this trip" is clicked, **Then** the export drawer opens with this trip pre-selected.

---

### User Story 3 - Export: Exporting a Trip via Drawer (Priority: P2)

A user initiates an export from either the library or the player. A slide-in drawer
appears (replacing the current separate export page) showing the trip summary, output
mode selection (lossless recommended / re-encode), quality preset when re-encode is
chosen, optional time range inputs, and output directory with a browse button. After
clicking Export, the drawer transitions to a progress view with phase label, progress
bar, percentage, and estimated time remaining. When complete, the drawer closes
automatically. The user can cancel mid-export.

**Why this priority**: Export is the core value-delivery action; redesigning it as a
drawer significantly improves the workflow by keeping the user in context.

**Independent Test**: Open the export drawer from a trip card. Verify options appear,
submit triggers progress view, cancel works mid-export, and the drawer closes on
completion.

**Acceptance Scenarios**:

1. **Given** a trip with lossless-compatible codecs, **When** the export drawer opens, **Then** "Lossless (recommended)" is pre-selected and the re-encode option is available.
2. **Given** a trip requiring re-encode, **When** the export drawer opens, **Then** "Re-encode" is automatically selected and the lossless option is disabled.
3. **Given** the user clicks Export, **When** export starts, **Then** the form is replaced by a progress view with phase label, progress bar, percentage, and ETA.
4. **Given** export is in progress, **When** Cancel is clicked, **Then** the operation stops and the drawer returns to the form state.
5. **Given** export completes, **When** progress reaches 100%, **Then** the drawer closes automatically after a brief confirmation moment.

---

### User Story 4 - Settings: Configuring the App (Priority: P3)

A user navigates to Settings and configures three sections: General (default scan
directory, gap detection minutes, default view mode), Export (default output directory,
filename template with token help tooltip), and Naming Patterns (builtin patterns are
read-only; custom patterns can be added and deleted).

**Why this priority**: Settings already exist in the current app; this story is a
visual redesign with the shadcn component system. Core logic is unchanged.

**Independent Test**: Open Settings. Modify gap detection minutes, add a custom naming
pattern, delete it, and change the filename template. Verify all changes persist across
app restarts.

**Acceptance Scenarios**:

1. **Given** the Settings view opens, **When** rendered, **Then** three sections are visible: General, Export, and Naming Patterns.
2. **Given** the user adds a custom naming pattern, **When** saved, **Then** it appears in the table and can be deleted; builtin patterns show no delete button.
3. **Given** the filename template field is focused, **When** the help icon is hovered, **Then** a tooltip lists available tokens (`{date}`, `{time}`, `{seq}`, `{duration}`).

---

### User Story 5 - Import: Scanning a Folder (Priority: P3)

A user clicks "Scan folder" in the library toolbar. The existing import flow is
preserved and integrated into the new navigation shell — it launches from the button
and returns the user to the updated library when complete.

**Why this priority**: The import flow already works; this story ensures it is wired
into the new shell without regression.

**Independent Test**: Click "Scan folder" in the new library toolbar. Verify the
import flow launches and, when done, returns to the library with updated trips.

**Acceptance Scenarios**:

1. **Given** the user clicks "Scan folder", **When** triggered, **Then** the import flow opens.
2. **Given** the import completes, **When** the flow finishes, **Then** the user is returned to the Library and the newly scanned trips appear.

---

### Edge Cases

- What happens when a trip has zero cached thumbnails? Cards must render a placeholder icon instead of a broken image.
- How does the filmstrip behave when a trip has more than 30 clips? It must scroll horizontally without layout breakage.
- What happens if the export drawer is opened while no trip is selected? The drawer must not render (guard condition).
- What if the output directory entered in the export drawer does not exist? The field accepts the value; validation happens at export time via the existing data layer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app shell MUST display a vertical sidebar with navigation items: Library, Player (disabled when no trip is selected), and Settings.
- **FR-002**: The Library view MUST display trips as cards in grid or list layout, togglable by the user, with the preference persisted across sessions.
- **FR-003**: Each trip card MUST show: thumbnail, trip name, duration badge, clip count badge, and codec compatibility indicator (lossless / re-encode needed).
- **FR-004**: Trip cards for disconnected media MUST appear visually dimmed with action buttons disabled and a tooltip explaining the reason.
- **FR-005**: The Library toolbar MUST include a search input that filters trips in real time by name and date.
- **FR-006**: The Library toolbar MUST include a sort dropdown with options: Date (newest), Date (oldest), Duration, Name.
- **FR-007**: Hovering over a trip card MUST scrub through cached thumbnail previews along the card's bottom edge.
- **FR-008**: The Library MUST display an empty state when no trips exist, with a "Scan folder" call-to-action button.
- **FR-009**: The Player view MUST include: video area, seek bar spanning the full trip timeline, play/pause, volume control, clip counter ("Clip N / Total"), and dashcam timestamp overlay.
- **FR-010**: The Player MUST include a horizontal scrollable filmstrip of all clips; clicking a clip MUST jump playback to that clip and highlight it.
- **FR-011**: The Player MUST include a metadata sidebar showing date, start time, total duration, clip count, resolution, codec status, and folder path.
- **FR-012**: The export interface MUST be a slide-in drawer, not a separate page.
- **FR-013**: The export drawer MUST auto-select "Lossless" for compatible trips and "Re-encode" for incompatible trips, disabling the lossless option when codecs are incompatible.
- **FR-014**: The export drawer MUST show a live progress view (phase label, progress bar, percentage, ETA) after export starts, replacing the options form.
- **FR-015**: Settings MUST include three sections — General, Export, and Naming Patterns — all wired to persistent storage via the existing data layer.
- **FR-016**: The existing import flow MUST remain functional and accessible via the "Scan folder" button in the Library toolbar.
- **FR-017**: All existing IPC calls (`window.api.*`) MUST be preserved as the sole source of real data — no mock or hardcoded data in production code.
- **FR-018**: The new UI MUST use the shadcn/ui component system and Tailwind CSS throughout, replacing all inline style objects in the renderer.

### Key Entities

- **Trip**: A grouped sequence of clips from a continuous recording session. Carries name, date/time, duration, clip count, codec compatibility, resolution, folder path, thumbnails array, and media connection status.
- **Clip**: An individual video file belonging to a trip. Has index position, thumbnail, and duration used in the filmstrip.
- **Pattern**: A naming convention rule. Either builtin (read-only) or custom (user-created, deletable).
- **AppStore**: Client-side state holding navigation, library state, player state, export state, and settings — hydrated from the IPC layer on mount.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All screens (Library, Player, Export drawer, Settings, Import flow) are reachable and fully functional in the Electron app after migration, with zero regressions in existing data-layer behavior.
- **SC-002**: Hover-scrub on trip cards responds within the existing 50 ms budget between thumbnail frames.
- **SC-003**: The library renders up to 200 trips without visible layout issues or jank.
- **SC-004**: Zero inline style objects remain in `src/renderer/` after migration (all styling via Tailwind/shadcn).
- **SC-005**: The export drawer opens in under 200 ms from the user's click.
- **SC-006**: Settings changes persist correctly across app restarts, verified via the existing settings IPC path.

## Assumptions

- Tailwind CSS and shadcn/ui are not yet installed in the renderer and will be added as part of this feature.
- Zustand is not yet installed in the renderer and will be introduced as the client-side state manager.
- The `_v0-ui/` folder at the repo root is the reference implementation and will be deleted after migration is complete.
- The v0 `Trip` type in `_v0-ui/lib/store.ts` will be reconciled with the canonical `Trip` from `src/interfaces/trips.ts`; the interface definition is the source of truth.
- The v0 `PlayerView` uses simulated playback; the migrated player will use the existing `TripPlayer` IPC logic adapted to the new component shell.
- Next.js-specific patterns (`"use client"`, `@/` path aliases, `app/` routing) will be removed during migration; no Next.js dependency will be introduced.
