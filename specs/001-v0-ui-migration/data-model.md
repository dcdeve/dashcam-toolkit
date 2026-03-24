# Data Model: v0-UI Migration

**Phase 1 output for**: `001-v0-ui-migration`
**Date**: 2026-03-20

This document describes the client-side state model (Zustand store) and how it
maps to the canonical IPC interfaces. No database schema changes are made.

---

## Store Slices

### Navigation

```
currentPage: 'library' | 'player' | 'settings'
selectedTrip: UITrip | null
```

`selectedTrip` determines whether the Player nav item is enabled. It is set when
the user clicks a trip card.

### Library

```
trips: UITrip[]
clips: UIClip[]
viewMode: 'grid' | 'list'          — persisted to localStorage
activeTab: 'trips' | 'clips'       — persisted to localStorage
sortOption: 'date-desc' | 'date-asc' | 'duration' | 'name'
searchQuery: string
isLoading: boolean
error: string | null
```

### Player

```
currentClipIndex: number
isPlaying: boolean
currentTime: number                 — seconds, global trip timeline
volume: number                      — 0.0–1.0
```

### Export

```
isExportOpen: boolean
exportProgress: number              — 0–100
exportPhase: string                 — "Analyzing clips..." | "Concatenating..." | "Done"
isExporting: boolean
```

### Settings

```
settings: {
  defaultScanDirectory: string
  gapDetectionMinutes: number
  defaultViewMode: 'grid' | 'list'
  defaultOutputDirectory: string
  filenameTemplate: string
  patterns: UIPattern[]
}
```

---

## UI Types

### UITrip
Flat view-model adapted from `src/interfaces/trips.ts → Trip`.

```
id: string
name: string                        — e.g. "2024-03-15 · 08:32"
date: string                        — ISO date portion "YYYY-MM-DD"
time: string                        — "HH:MM"
duration: number                    — totalDuration in seconds
clipCount: number
codec: 'lossless' | 'reencode'      — derived from codecCompat
resolution: string                  — e.g. "4K" or "1080p" from first clip
folderPath: string                  — dirname of first clip path
thumbnails: string[]                — file:// URLs from IPC thumbnails
connected: boolean                  — derived from Trip.status
```

**Source**: `window.api.trips.list()` + `window.api.thumbnails.getForTrip(id)`

**Derivation rules**:
- `name`: `format(startedAt, 'yyyy-MM-dd') + ' · ' + format(startedAt, 'HH:mm')`
- `date`: `format(startedAt, 'yyyy-MM-dd')`
- `time`: `format(startedAt, 'HH:mm')`
- `codec`: `codecCompat === 'lossless' ? 'lossless' : 'reencode'`
- `connected`: `status === 'ok'`
- `resolution`: from first clip `width × height` → label ('4K' if ≥ 3840 px wide, else '1080p', etc.)

### UIClip
Flat view-model from `src/interfaces/trips.ts → Clip`.

```
id: string
filename: string
path: string
duration: number                    — seconds
width: number
height: number
size: number
timestampSource: Date
tripId: string | null
thumbnail: string | null            — file:// URL
```

**Source**: `window.api.clips.list()`

### UIPattern
Flat view-model from `src/interfaces/patterns.ts → Pattern`.

```
id: string
name: string
pattern: string                     — glob string
builtin: boolean
```

**Source**: `window.api.patterns.list()`

---

## Store Initialization Sequence

```
App mounts
  → store.initialize()
      → window.api.settings.get()         → store.settings
      → window.api.trips.list()           → raw trips
      → window.api.clips.list()           → raw clips
      → window.api.patterns.list()        → patterns → store.settings.patterns
      → for each trip:
          window.api.thumbnails.getForTrip(trip.id) → UITrip.thumbnails
      → derive UITrip[] and UIClip[] from raw data
      → store.trips = UITrip[]
      → store.clips = UIClip[]
      → store.isLoading = false
```

This sequence runs once on mount. Re-scans (triggered by ImportFlow) call
`store.refresh()` which re-runs the same sequence.

---

## Settings Persistence

Settings are stored via the existing `window.api.settings.*` IPC path (SQLite
`settings` table). The store mirrors them in memory. On change, the store:
1. Calls `window.api.settings.set(key, value)`
2. Updates local state optimistically

Pattern adds/deletes call `window.api.patterns.add()` / `window.api.patterns.delete()`
then refresh the patterns list.

---

## State Transitions

### Trip selection

```
Library → click trip card
  → store.setSelectedTrip(trip)
  → store.setCurrentPage('player')
  → store.setCurrentClipIndex(0)
  → store.setCurrentTime(0)
```

### Export open

```
TripCard "Export" button  OR  PlayerView "Export this trip"
  → store.setIsExportOpen(true)
  (selectedTrip already set from navigation flow)
```

### Export complete

```
ExportDrawer → export finishes (IPC progress event reaches 100%)
  → store.setIsExportOpen(false)
  → store.setExportProgress(0)
  → store.setExportPhase('')
  → store.setIsExporting(false)
```
