# Feature Specification: Folder Browser — Library Navigation by Scanned Folder

**Feature Branch**: `004-folder-browser`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "Vista de trips por carpeta — cada carpeta escaneada se muestra como entrada independiente, con análisis mínimo de salud (necesita rescan) y navegación de dos niveles en la Library."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse Trips by Folder (Priority: P1)

The user opens the Library and sees a grid of scanned folders instead of an undifferentiated list of all trips. Each folder card shows the folder name, how many trips and clips it contains, when it was last scanned, and a health badge. The user clicks a folder and sees only the trips belonging to that folder. They can go back to the folder grid at any time.

**Why this priority**: This is the core navigational change. Without it the feature has no value. All other stories depend on this view existing.

**Independent Test**: Open the app with at least one previously scanned folder → Library shows a folder grid → click a folder → only trips from that folder appear → back button returns to the folder grid.

**Acceptance Scenarios**:

1. **Given** the app has at least one scanned folder, **When** the user opens the Library, **Then** a grid of folder cards is shown instead of the flat trip list.
2. **Given** the folder grid is visible, **When** the user clicks a folder card, **Then** only the trips whose clips belong to that folder are shown.
3. **Given** the folder detail view is open, **When** the user clicks the back button, **Then** the folder grid is restored.
4. **Given** no folders have been scanned, **When** the user opens the Library, **Then** an empty state is shown with a prompt to scan a folder.

---

### User Story 2 — Folder Health Check (Priority: P2)

When the user views the folder grid, each card shows whether the folder contents on disk match what was indexed. A green badge means the folder is up to date. A yellow badge means files have been added, removed, or renamed since the last scan. A grey badge means the folder state is unknown (e.g., path not currently accessible). The health check runs automatically in the background when the folder grid loads.

**Why this priority**: The health badge is what makes the folder list actionable — the user knows at a glance which folders need attention without opening each one.

**Independent Test**: Scan a folder, add a video file to it outside the app, re-open the Library → the folder card shows a yellow "stale" badge.

**Acceptance Scenarios**:

1. **Given** a folder whose files on disk match the last scan, **When** the folder grid loads, **Then** that folder shows a green "up to date" badge after the check completes.
2. **Given** a folder that has new or deleted video files since the last scan, **When** the folder grid loads, **Then** that folder shows a yellow "needs rescan" badge.
3. **Given** a folder whose path is no longer accessible on disk, **When** the folder grid loads, **Then** that folder shows a grey "unknown" badge.
4. **Given** the health check is in progress, **When** the folder card is rendered, **Then** a loading indicator is shown until the check resolves.

---

### User Story 3 — Rescan a Folder from Folder Detail (Priority: P3)

From the folder detail view, the user can trigger a rescan of the selected folder. The rescan opens the existing import flow pre-loaded with the folder path, allowing the user to confirm before scanning.

**Why this priority**: Completes the feedback loop — the user sees that a folder is stale and can act on it immediately without navigating away to find the scan button.

**Independent Test**: Open a stale folder's detail view → click "Rescan" → the import drawer opens with the folder path pre-filled → complete the scan → the folder health badge updates to green.

**Acceptance Scenarios**:

1. **Given** the folder detail view is open, **When** the user clicks "Rescan", **Then** the import drawer opens with the folder path already populated.
2. **Given** the import drawer is open from a rescan action, **When** the user completes the scan, **Then** the folder's health badge updates to reflect the new scan state.
3. **Given** the import drawer is open from a rescan action, **When** the user cancels, **Then** the folder detail view is restored unchanged.

---

### Edge Cases

- What happens when a trip's clips span two different scanned folders? The trip appears under the folder that contains the first clip only.
- What happens when a folder is deleted from disk after being scanned? It is shown with a grey "unknown" badge and its trips remain browsable from cached data.
- What happens when the user scans a folder for the first time while the folder grid is open? The grid refreshes to include the new folder entry after the scan completes.
- What happens when two scanned paths are nested (e.g., `/DCIM` and `/DCIM/Trip1`)? Each is treated as a separate folder entry; trips are assigned to the longest matching path.

## Clarifications

### Session 2026-03-24

- Q: Can users delete a folder entry from the Library? → A: Yes, with a confirmation dialog, accessible from the folder card (e.g., a ⋯ menu or context action). Deleting a folder removes the folder record and its associated trips from the Library; the actual files on disk are not affected.
- Q: At which step does the ImportDrawer open when triggered from "Rescan"? → A: Step 2 (confirm/preview) — the directory selection step is skipped since the path is already known. The user sees the detected clip count and can confirm or cancel before scanning begins.
- Q: How are folder cards ordered in the grid? → A: User-selectable sort. Default order is stale-first then by last scan date descending. The grid provides a sort control with options: name (A–Z), last scanned (newest first), health status (stale first), trip count.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Library MUST display a folder grid as its default top-level view when at least one folder has been scanned.
- **FR-002**: Each folder card MUST show: folder name (last path segment), trip count, clip count, date of last scan, and a health badge.
- **FR-003**: Clicking a folder card MUST navigate to a folder detail view showing only the trips belonging to that folder.
- **FR-004**: The folder detail view MUST include a back button that returns the user to the folder grid.
- **FR-005**: The folder detail view MUST include a "Rescan" button that opens the import drawer at the confirm/preview step (step 2), with the folder path pre-loaded and the directory selection step bypassed.
- **FR-006**: The system MUST perform a health check for each folder automatically when the folder grid is displayed.
- **FR-007**: The health check MUST determine folder state by comparing a hash of current video file names and sizes on disk against the hash stored at last scan time — without reading file contents.
- **FR-008**: The health check MUST return one of three states: `ok` (hash matches), `stale` (hash differs), or `unknown` (path not accessible).
- **FR-009**: The system MUST store, per scanned folder: path, last scan timestamp, clip count at scan time, and the files hash at scan time.
- **FR-010**: The folder record MUST be created or updated automatically at the end of every successful scan.
- **FR-011**: A trip MUST be assigned to the folder whose path is the longest prefix match for the path of its first clip.
- **FR-012**: The folder grid MUST show an empty state with a call-to-action when no folders have been scanned.
- **FR-014**: The folder grid MUST provide a sort control allowing the user to order folder cards by: name (A–Z), last scanned (newest first), health status (stale first), or trip count. The default sort order is health status (stale first), then last scanned descending.
- **FR-013**: Each folder card MUST expose a delete action (e.g., via a ⋯ menu) that, after user confirmation, removes the folder record and all its associated trips from the Library without affecting files on disk.

### Key Entities

- **ScannedFolder**: Represents a directory that has been indexed by the scanner. Attributes: unique path, last scan timestamp, clip count at scan, video files hash at scan. Has many Trips (via clips).
- **UIFolder**: View model for the folder grid. Attributes: path, display name, trip count, clip count, last scan date, health status (`ok | stale | unknown | checking`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with 5+ scanned folders can identify which folders need rescanning without opening any individual folder — visible immediately from the folder grid.
- **SC-002**: The health check for any folder completes in under 2 seconds regardless of the number of clips previously indexed.
- **SC-003**: Navigating from the folder grid into a folder detail view and back completes in under 300 ms with no full data reload.
- **SC-004**: After a rescan completes, the folder health badge updates to the correct state without requiring a manual refresh.
- **SC-005**: All existing trip browsing, playback, and export functionality works identically when accessed from within a folder detail view.

## Assumptions

- The "folder" concept maps 1:1 to a top-level directory passed to the scanner. Subdirectories discovered recursively during a scan are not tracked as separate folder entries.
- The health check uses filesystem metadata only (name + size) — not a cryptographic file integrity check. Speed over precision is intentional.
- Trips whose clips span multiple folders are assigned to the folder of the first clip. This edge case is rare and acceptable for current scope.
- The existing import drawer is reused for the rescan flow; no new scan UI is built.
- Folders that no longer exist on disk are retained in the folder grid with an "unknown" badge so the user retains access to previously indexed trip data.
