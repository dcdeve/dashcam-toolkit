# Feature Specification: Inline Import Flow

**Feature Branch**: `002-inline-import-flow`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Collapse the import flow: the Scan folder button in the Library toolbar should directly open the OS folder picker dialog instead of navigating to the ImportFlow page. After folder selection, the detect → confirm → scan → done steps should happen inline without leaving the Library page — ideally as a modal/drawer or an inline panel. The ImportFlow page and its route ('import') can be removed or repurposed. There should always be a clear way to cancel and return to the library."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Folder Picker Directly From Library (Priority: P1)

A user in the Library clicks "Scan folder" and immediately sees the OS folder picker — no intermediate screen. After selecting a folder, the import progress appears as a modal/drawer overlaid on the Library without navigating away.

**Why this priority**: This is the core UX improvement. Eliminating the intermediate screen reduces friction and confusion. The Library stays visible throughout, giving the user orientation and context.

**Independent Test**: Can be tested by clicking "Scan folder", selecting a folder, and verifying the Library page is still visible underneath the import overlay.

**Acceptance Scenarios**:

1. **Given** the user is on the Library page, **When** they click "Scan folder", **Then** the OS native folder picker opens immediately without any page navigation.
2. **Given** the user selects a valid dashcam folder, **When** the folder picker closes, **Then** an import overlay (modal/drawer) appears over the Library showing detection and confirmation steps.
3. **Given** the import overlay is open, **When** the user dismisses or cancels it, **Then** they are returned to the Library with no changes made.

---

### User Story 2 - Cancel At Any Step (Priority: P2)

At every step of the import flow — folder picked, detection in progress, confirmation, scanning — the user can cancel and return cleanly to the Library.

**Why this priority**: Without a back button or sidebar the current implementation traps users. This story ensures no dead-ends exist in the flow.

**Independent Test**: Can be tested by opening the import overlay and canceling at each step: detecting, confirm, and scanning.

**Acceptance Scenarios**:

1. **Given** the import overlay is in the detecting step, **When** the user cancels, **Then** the overlay closes and the Library is shown unchanged.
2. **Given** the import overlay is in the confirm step, **When** the user clicks Cancel, **Then** the overlay closes and no scan is performed.
3. **Given** a scan is in progress, **When** the user cancels, **Then** the scan stops and the overlay closes, returning the user to the Library.

---

### User Story 3 - Import Completes and Library Refreshes (Priority: P3)

After a successful import, the Library automatically shows the newly imported trips/clips without requiring a manual refresh.

**Why this priority**: End-to-end completion of the happy path. Ensures the collapsed flow still delivers the same data outcome as the original page-based flow.

**Independent Test**: Can be tested by completing a full import and verifying new trips appear in the Library immediately.

**Acceptance Scenarios**:

1. **Given** a scan completes successfully, **When** the user dismisses the "Import complete" summary in the overlay, **Then** the overlay closes and the Library reflects the newly imported trips and clips.
2. **Given** a scan completes with errors, **When** the summary is shown, **Then** the error count is visible alongside the success count before the user dismisses.

---

### Edge Cases

- What happens when the user selects a folder with no video files? The overlay shows a clear "No videos found" message with an option to pick a different folder.
- What happens when the user closes the folder picker without selecting anything? The overlay never appears; the Library remains unchanged.
- What happens if the scan errors midway? The overlay transitions to an error state with a retry option and a cancel option.
- What happens if the user clicks "Scan folder" while an import is already in progress? The button is disabled or the existing overlay is brought to focus.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to open the OS folder picker by clicking "Scan folder" without navigating away from the Library page.
- **FR-002**: The import progress (detecting, confirming, scanning, done, error) MUST be displayed in an overlay (modal or drawer) that appears on top of the Library.
- **FR-003**: The Library page MUST remain visible underneath the import overlay at all times during the import flow.
- **FR-004**: Users MUST be able to cancel the import and dismiss the overlay at every step of the flow.
- **FR-005**: Upon successful import completion, the Library MUST automatically refresh to show newly imported trips and clips when the overlay is dismissed.
- **FR-006**: If the user dismisses the folder picker without selecting a folder, no overlay MUST appear and the Library MUST remain unchanged.
- **FR-007**: The "Scan folder" button MUST be disabled or protected against concurrent invocations while an import is already in progress.
- **FR-008**: The standalone Import page/route MUST be removed from the navigation so it is no longer reachable.

### Key Entities

- **ImportOverlay**: The modal/drawer UI component that hosts all import steps inline over the Library. Replaces the ImportFlow page.
- **ImportStep**: One of the discrete states — idle → detecting → confirm → scanning → done | error.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users reach the folder picker in 1 click from the Library, down from 2 clicks (Library → Import page → picker).
- **SC-002**: The Library page is visible at all times during the import flow — verified by the absence of full-page navigation.
- **SC-003**: Users can cancel and return to the Library from any import step without reloading or losing their scroll position.
- **SC-004**: After a successful import, newly imported trips appear in the Library within 2 seconds of the user dismissing the overlay.
- **SC-005**: There are no dead-end states — every step of the flow provides a visible cancel or back action.

## Assumptions

- The OS folder picker is considered sufficient for folder selection; no custom in-app folder browser is needed.
- A drawer (slide-in panel) is preferred over a full modal dialog because it keeps more Library context visible, but either is acceptable.
- Canceling a scan in progress does not roll back already-written data; it stops further processing.
- The ImportFlow page route removal does not break any deep links or external references (it was an internal navigation state, not a URL route).
