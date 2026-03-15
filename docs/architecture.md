# Arquitectura

## Stack

| Componente          | Tecnologia                                        |
| ------------------- | ------------------------------------------------- |
| Runtime             | Node.js + TypeScript                              |
| Framework UI        | Electron + React + TypeScript                     |
| DB                  | SQLite (better-sqlite3 + Drizzle ORM)             |
| FFmpeg (MVP)        | ffmpeg-static                                     |
| FFmpeg (prod)       | Auto-download por OS/arch al primer uso           |
| FFmpeg wrapper      | child_process.spawn directo (sin fluent-ffmpeg)   |
| Tokens de fecha     | date-fns (format/parse)                           |
| CLI framework       | Commander.js v14 + @commander-js/extra-typings    |
| Progress multi-fase | listr2                                            |
| Progress numerico   | cli-progress                                      |
| Build tooling       | electron-vite (dev) + electron-builder (dist)     |
| Test runner         | Vitest                                            |
| Logger              | console.log (electron-log pendiente para fase 4+) |
| Distribucion MVP    | Script de terminal, sin certificados              |
| Distribucion futura | Installers nativos firmados                       |

## Arquitectura de capas

```
┌─────────────────────────────────────────────────────────┐
│  Renderer (React)                                        │
│  Pages: Library | Player | Export | Settings              │
├─────────────────────────────────────────────────────────┤
│  IPC (invoke/handle)                                      │
├─────────────────────────────────────────────────────────┤
│  Electron Main Process                                    │
│  (thin wrapper: IPC handlers → core)                      │
├──────────────────┬──────────────────────────────────────┤
│  CLI (terminal)  │                                        │
│  Commands: scan, │  ← ambos consumen el mismo core        │
│  export, info... │                                        │
├──────────────────┴──────────────────────────────────────┤
│  Core (puro Node.js)                                      │
│  Modules: db | ffmpeg | scanner | patterns | trips        │
│           | exporter | thumbnails | monitor               │
├─────────────────────────────────────────────────────────┤
│  FFmpeg/FFprobe (sidecar) — spawn per operation           │
├─────────────────────────────────────────────────────────┤
│  SQLite (better-sqlite3 + Drizzle) — ~/.dashcam-toolkit/  │
└─────────────────────────────────────────────────────────┘
```

## Estructura de directorios

```
src/
  core/           # Puro Node.js — sin dependencias de Electron
    modules/      # db, ffmpeg, scanner, patterns, trips, exporter, thumbnails, monitor
    migrations/   # SQL files (001_initial.sql, ...)
  cli/            # Interfaz terminal
    commands/     # scan, export, info, patterns, trips, config
    index.ts      # Entry point CLI
  main/           # Main process Electron (convencion electron-vite)
    ipc/          # Handlers IPC → core
    index.ts      # Entry point main
  preload/        # Preload script (convencion electron-vite)
    index.ts      # Context bridge
  renderer/       # React app
    pages/        # Library, Player, Export, Settings
    components/   # UI components
    hooks/        # Custom hooks
    App.tsx
    main.tsx      # Entry point renderer
  shared/         # Tipos compartidos (core, CLI, y renderer)
    types/
    constants/
tests/
  unit/           # Tests unitarios por modulo
  contracts/      # Tests de contrato (interfaces)
  e2e/            # Tests end-to-end
```

## CLI

```
dashcam scan <dir>                    # Escanea, auto-detect pattern, agrupa trips, guarda en DB
dashcam scan <dir> --rescan           # Re-escanea (actualiza nuevos/removidos)
dashcam scan <dir> --pattern <name>   # Forzar pattern (skip auto-detect)
dashcam scan <dir> --gap <minutes>    # Override gap de agrupacion (default 5)

dashcam export <trip-id...>           # Exportar uno o varios trips
dashcam export <file...>              # Exportar uno o varios clips directos
dashcam export <trip-id> --range 00:05:00-00:15:00  # Rango temporal
dashcam export --dir <dir>            # Exportar todo lo escaneado
dashcam export ... --output <path>    # Destino custom
dashcam export ... --reencode         # Forzar re-encode (default: lossless)
dashcam export ... --preset <name>    # alta/media/baja

dashcam info <file...>                # Probe detallado (codecs, resolucion, duracion, pattern)
dashcam patterns                      # Lista builtin + custom patterns
dashcam patterns add <name> <format>  # Agregar pattern custom
dashcam trips                         # Lista trips en DB
dashcam trips show <trip-id>          # Detalle de un trip con sus clips
dashcam config                        # Mostrar config actual
dashcam config set <key> <value>      # Cambiar setting
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

| Tema                   | Decision                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| Archivos               | In-place, no copia                                                  |
| Persistencia           | Viajes y clips en SQLite entre sesiones                             |
| UI metafora            | Biblioteca de medios (no file explorer)                             |
| Vistas                 | Toggle lista/grid, preferencia persistida                           |
| Naming                 | Pattern matching bidireccional con date-fns + ~10 builtin patterns  |
| Import patterns        | Auto-detect con confirmacion del usuario                            |
| Export naming          | Template configurable con tokens fecha + secuencia                  |
| Deteccion de viajes    | Gap temporal configurable (default 5min)                            |
| Preview de viaje       | Dual video swap (sin concat real)                                   |
| Hover preview          | Scrub de thumbnails estilo YouTube                                  |
| Player controles       | Play/pause, seek bar global, clip N/total, timestamp dashcam        |
| Export destino         | Directorio default, configurable en settings                        |
| Archivos desconectados | Estado gris, thumbnails cacheados visibles, acciones deshabilitadas |

## Metricas de exito

| Metrica                          | Target                 |
| -------------------------------- | ---------------------- |
| Import de 500 clips              | <15 segundos           |
| Hover scrub latencia             | <50ms entre thumbnails |
| Dual video swap gap              | <100ms (imperceptible) |
| Export lossless 1h de viaje      | <30 segundos           |
| RAM con biblioteca de 2000 clips | <500MB                 |

## Riesgos principales

| Riesgo                                      | Mitigacion                                           |
| ------------------------------------------- | ---------------------------------------------------- |
| Codecs incompatibles para concat lossless   | Detectar en probe, ofrecer re-encode                 |
| Timestamps inconsistentes entre fabricantes | Fallback chain: pattern → metadata → mtime → unknown |
| Dual video swap con gap perceptible         | Precargar siguiente clip con preload="auto"          |
| Performance con 5000+ clips                 | Virtualizacion, lazy thumbnails, probe en batches    |
| Formatos GPS propietarios                   | Priorizar top 10 fabricantes, parser extensible      |

## Pendiente para Fase 1+

- Confirmar set de ~10 builtin patterns con clips reales (Fase 2)
- Definir estructura exacta de migrations (Fase 1)
