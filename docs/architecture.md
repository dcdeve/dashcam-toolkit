# Arquitectura

## Stack
| Componente | Tecnologia |
|-----------|-----------|
| Framework | Electron + TypeScript |
| Frontend | React + TypeScript |
| DB | SQLite (better-sqlite3) |
| FFmpeg (MVP) | @ffmpeg-installer/ffmpeg |
| FFmpeg (prod) | Auto-download por OS/arch al primer uso |
| Tokens de fecha | date-fns (format/parse) |
| Distribucion MVP | Script de terminal, sin certificados |
| Distribucion futura | Installers nativos firmados |

## Estructura del proceso

```
┌──────────────────────────────────────────────────────────┐
│  Renderer (React)                                         │
│  Pages: Library | Player | Export | Settings               │
│  Components: TripCard, ClipGrid, VideoPlayer, SeekBar,    │
│              ViewToggle, ImportDialog, StatusBadge          │
├──────────────────────────────────────────────────────────┤
│  IPC (invoke/handle)                                       │
├──────────────────────────────────────────────────────────┤
│  Main Process (Node.js)                                    │
│  Modules: ffmpeg | scanner | patterns | trips | exporter  │
│           | thumbnails | db | monitor | ipc                │
├──────────────────────────────────────────────────────────┤
│  FFmpeg/FFprobe (sidecar) — spawn per operation            │
├──────────────────────────────────────────────────────────┤
│  SQLite (better-sqlite3) — ~/.dashcam-toolkit/data.db      │
└──────────────────────────────────────────────────────────┘
```

## Modelo de datos (SQLite)

```sql
patterns        → naming conventions (builtin + custom, import/export, prioridad)
clips           → archivos de video (path, metadata, pattern_id, ts_source, trip_id, integrity)
trips           → viajes agrupados (nombre, timestamps, clip_count, compatibilidad, status)
thumbnails      → cache de thumbnails (por clip y por viaje/scrub)
settings        → config persistente (export_dir, gap_minutes, export_template, view_mode, etc.)
```

## Decisiones de producto

| Tema | Decision |
|------|---------|
| Archivos | In-place, no copia |
| Persistencia | Viajes y clips en SQLite entre sesiones |
| UI metafora | Biblioteca de medios (no file explorer) |
| Vistas | Toggle lista/grid, preferencia persistida |
| Naming | Pattern matching bidireccional con date-fns + ~10 builtin patterns |
| Import patterns | Auto-detect con confirmacion del usuario |
| Export naming | Template configurable con tokens fecha + secuencia |
| Deteccion de viajes | Gap temporal configurable (default 5min) |
| Preview de viaje | Dual video swap (sin concat real) |
| Hover preview | Scrub de thumbnails estilo YouTube |
| Player controles | Play/pause, seek bar global, clip N/total, timestamp dashcam |
| Export destino | Directorio default, configurable en settings |
| Archivos desconectados | Estado gris, thumbnails cacheados visibles, acciones deshabilitadas |

## Metricas de exito

| Metrica | Target |
|---------|--------|
| Import de 500 clips | <15 segundos |
| Hover scrub latencia | <50ms entre thumbnails |
| Dual video swap gap | <100ms (imperceptible) |
| Export lossless 1h de viaje | <30 segundos |
| RAM con biblioteca de 2000 clips | <500MB |

## Riesgos principales

| Riesgo | Mitigacion |
|--------|-----------|
| Codecs incompatibles para concat lossless | Detectar en probe, ofrecer re-encode |
| Timestamps inconsistentes entre fabricantes | Fallback chain: pattern → metadata → mtime → unknown |
| Dual video swap con gap perceptible | Precargar siguiente clip con preload="auto" |
| Performance con 5000+ clips | Virtualizacion, lazy thumbnails, probe en batches |
| Formatos GPS propietarios | Priorizar top 10 fabricantes, parser extensible |

## Pendiente para Fase 0
- Confirmar set de ~10 builtin patterns (fabricantes especificos)
- Definir estructura exacta de migrations
- Elegir test runner (vitest vs jest)
- Definir estrategia de logging
- Evaluar si electron-forge o electron-builder desde el scaffold
