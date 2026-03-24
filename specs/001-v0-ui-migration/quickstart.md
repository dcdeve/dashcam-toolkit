# Quickstart: v0-UI Migration

**Phase 1 output for**: `001-v0-ui-migration`
**Date**: 2026-03-20

Use this guide to validate the migrated UI end-to-end after implementation.

---

## Prerequisites

- `make setup` completed (deps installed, native rebuilt, TypeScript compiled)
- A real or simulated dashcam footage directory (or an existing `.dashcam-toolkit/` SQLite DB)

---

## Step 1: Install new renderer dependencies

```bash
npm install tailwindcss @tailwindcss/vite zustand lucide-react \
  clsx tailwind-merge class-variance-authority \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-label @radix-ui/react-progress \
  @radix-ui/react-radio-group @radix-ui/react-scroll-area \
  @radix-ui/react-select @radix-ui/react-separator \
  @radix-ui/react-slider @radix-ui/react-slot \
  @radix-ui/react-switch @radix-ui/react-tabs \
  @radix-ui/react-toast @radix-ui/react-toggle \
  @radix-ui/react-toggle-group @radix-ui/react-tooltip
```

---

## Step 2: Start dev mode

```bash
make dev
```

The Electron window opens. The new sidebar-based UI should appear.

---

## Step 3: Validate Library (US1)

1. App opens on Library page — sidebar shows Library (active), Player (disabled), Settings.
2. If DB has trips: cards render in grid with thumbnails, name, duration badge, clip count badge.
3. Toggle list/grid — layout switches.
4. Type in search bar — cards filter in real time.
5. Change sort dropdown — order updates.
6. If a trip has disconnected media: card appears dimmed, buttons disabled.
7. Hover over a trip card — thumbnail scrubs across bottom edge.
8. If no trips: empty state shows "Scan folder" CTA.

---

## Step 4: Validate Import (US5)

1. Click "Scan folder" in Library toolbar.
2. ImportFlow opens — select a dashcam footage directory.
3. Scan completes — Library updates with new trips.

---

## Step 5: Validate Player (US2)

1. Click a trip card — Player opens.
2. Sidebar: Player nav item is now enabled.
3. Video area shows thumbnail (real video if file is accessible).
4. Seek bar: click at 50% position — time updates.
5. Filmstrip: all clips visible, scrollable, clicking a clip highlights it and jumps time.
6. Metadata sidebar: date, start time, duration, clip count, resolution, codec badge, folder path all populated.
7. "Export this trip" button is visible.

---

## Step 6: Validate Export Drawer (US3)

1. Click "Export this trip" from Player — drawer slides in from right.
2. Lossless trip: "Lossless (recommended)" pre-selected.
3. Re-encode trip: "Re-encode" pre-selected, lossless option disabled.
4. Set output directory, click Export.
5. Progress view replaces form: phase label, progress bar, % advance.
6. Click Cancel — export stops, form returns.
7. Let export complete — drawer closes automatically.

---

## Step 7: Validate Settings (US4)

1. Navigate to Settings via sidebar.
2. Modify "Gap Detection" minutes — save persists across restart.
3. Add a custom pattern (name + glob) — appears in table.
4. Delete the custom pattern — row removed; builtin patterns have no delete button.
5. Change filename template — hover help icon to see token tooltip.

---

## Step 8: TypeScript and lint

```bash
make typecheck   # Must pass — zero TS errors
make lint        # Must pass — zero ESLint errors
make check       # Full: lint + format + typecheck + tests
```

---

## Step 9: Verify zero inline styles

```bash
grep -r "style={{" src/renderer/ --include="*.tsx"
# Expected output: (empty — zero results)
```

---

## Step 10: Cleanup

Once all steps pass, delete the reference folder:

```bash
rm -rf _v0-ui/
```

Then commit:

```bash
make commit m="feat(renderer): migrate UI to shadcn/Tailwind v4 (v0-ui-migration)"
```
