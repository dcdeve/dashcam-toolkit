# PLAN: dashcam-toolkit

## Descripcion
App desktop cross-platform (Electron + React + TypeScript) y CLI para procesar
videos de dashcam. Universal (multi-fabricante), con auto-agrupacion de viajes,
preview sin renderizar, y concatenacion lossless. Core puro Node.js consumido
por CLI (power users) y UI grafica (usuarios no-tecnicos).

## Modulos
| Modulo | Capa | Responsabilidad |
|--------|------|----------------|
| db | core | SQLite setup, migrations, queries (better-sqlite3 + Drizzle) |
| ffmpeg | core | Detectar FFmpeg, probe, spawn con progress |
| patterns | core | Parse/format naming conventions con date-fns, auto-detect |
| scanner | core | Readdir recursivo, probe paralelo, import pipeline |
| trips | core | Gap detection, agrupacion, compatibilidad de codecs |
| exporter | core | Concat lossless / re-encode, progress, export templates |
| thumbnails | core | Generacion y cache (1/clip + ~30/viaje para hover scrub) |
| monitor | core | Deteccion SD/USB, auto-scan, re-import inteligente |
| cli | cli | Interfaz terminal (scan, export, info, patterns, trips, config) |
| ipc | electron | Bridge main↔renderer, preload, tipos compartidos |

## Fases
| # | Fase | Sub-plan | Estado |
|---|------|----------|--------|
| 0 | Stack y Scaffolding | plans/phase-0.md | en curso |
| 1 | Interfaces y Modulos | plans/phase-1.md | pendiente |
| 2 | Core Engine + CLI | plans/phase-2.md | pendiente |
| 3 | Electron + UI | plans/phase-3.md | pendiente |
| 4 | V1 Producto Usable | plans/phase-4.md | pendiente |
| 5 | Installer + Distribucion | plans/phase-5.md | pendiente |
| 6 | Features Avanzados | plans/phase-6.md | pendiente |

## Archivos clave
- STATUS.md -- Puntero (leer primero)
- plans/decisions.md -- Decisiones
- docs/interfaces.md -- Contratos
- docs/architecture.md -- Arquitectura y stack
- docs/tooling.md -- Skills y MCPs
