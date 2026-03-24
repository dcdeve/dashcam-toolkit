# IPC Surface Contract: v0-UI Migration

**Phase 1 output for**: `001-v0-ui-migration`
**Date**: 2026-03-20

This document defines which IPC channels the renderer consumes during this feature.
No new IPC channels are introduced. All channels listed here already exist and are
covered by tests in `tests/contracts/`.

---

## IPC Channels Consumed by Renderer

### Trips

| Channel | Direction | When called |
|---------|-----------|-------------|
| `trips.list()` | renderer → main | On store init, after scan completes |
| `trips.getById(id)` | renderer → main | PlayerView mount (if needed for clip list) |

### Clips

| Channel | Direction | When called |
|---------|-----------|-------------|
| `clips.list()` | renderer → main | On store init |
| `clips.listByTrip(tripId)` | renderer → main | PlayerView: populate filmstrip |

### Thumbnails

| Channel | Direction | When called |
|---------|-----------|-------------|
| `thumbnails.getForTrip(tripId)` | renderer → main | Store init per trip (batch) |
| `thumbnails.getForClip(clipPath)` | renderer → main | ClipCard display (clips tab) |

### Export

| Channel | Direction | When called |
|---------|-----------|-------------|
| `exporter.export(options)` | renderer → main | ExportDrawer "Export" click |
| `exporter.cancel()` | renderer → main | ExportDrawer "Cancel" click |

**Progress events** (main → renderer via IPC event):
```
exporter:progress  { phase: string, progress: number, eta?: number }
exporter:done
exporter:error     { message: string }
```

### Settings

| Channel | Direction | When called |
|---------|-----------|-------------|
| `settings.get()` | renderer → main | Store init |
| `settings.set(key, value)` | renderer → main | Any settings field change |

### Patterns

| Channel | Direction | When called |
|---------|-----------|-------------|
| `patterns.list()` | renderer → main | Store init |
| `patterns.add(name, format)` | renderer → main | SettingsView "Add pattern" |
| `patterns.delete(id)` | renderer → main | SettingsView delete custom pattern |

### Scanner (via ImportFlow)

| Channel | Direction | When called |
|---------|-----------|-------------|
| `scanner.scan(dir, options)` | renderer → main | ImportFlow "Scan" action |

**Progress events**:
```
scanner:progress   { phase: string, current: number, total: number }
scanner:done       { clipCount: number, tripCount: number }
scanner:error      { message: string }
```

---

## Renderer Promises

All `window.api.*` calls return Promises. The store's `initialize()` and
`refresh()` actions are `async` and set `isLoading` during execution.

## No New IPC Channels

This feature introduces zero new IPC endpoints. The renderer adapts to the existing
API surface. Any IPC channel not listed above is not used by the renderer post-migration.
