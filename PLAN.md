# PLAN: dashcam-toolkit

## Descripcion
App desktop cross-platform (Electron + React + TypeScript) para procesar videos
de dashcam. Universal (multi-fabricante), con UI grafica, auto-agrupacion de viajes,
preview sin renderizar, y concatenacion lossless.

## Modulos
| Modulo | Responsabilidad |
|--------|----------------|
| db | SQLite setup, migrations, queries (better-sqlite3) |
| ffmpeg | Detectar/descargar FFmpeg, probe, spawn con progress |
| patterns | Parse/format naming conventions con date-fns, auto-detect |
| scanner | Readdir recursivo, probe paralelo, import pipeline |
| trips | Gap detection, agrupacion, compatibilidad de codecs |
| exporter | Concat lossless / re-encode, progress, export templates |
| thumbnails | Generacion y cache (1/clip + ~30/viaje para hover scrub) |
| monitor | Deteccion SD/USB, auto-scan, re-import inteligente |
| ipc | Bridge main↔renderer, preload, tipos compartidos |

## Fases
| # | Fase | Sub-plan | Estado |
|---|------|----------|--------|
| 0 | Stack y Scaffolding | plans/phase-0.md | en curso |
| 1 | Interfaces y Modulos | plans/phase-1.md | pendiente |
| 2 | Core Engine (sin UI) | plans/phase-2.md | pendiente |
| 3 | MVP con UI | plans/phase-3.md | pendiente |
| 4 | V1 Producto Usable | plans/phase-4.md | pendiente |
| 5 | Installer + Distribucion | plans/phase-5.md | pendiente |
| 6 | Features Avanzados | plans/phase-6.md | pendiente |

## Archivos clave
- STATUS.md -- Puntero (leer primero)
- plans/decisions.md -- Decisiones
- docs/interfaces.md -- Contratos
- docs/architecture.md -- Arquitectura y stack
- docs/tooling.md -- Skills y MCPs
