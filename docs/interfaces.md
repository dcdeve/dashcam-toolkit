# Interfaces entre Modulos

## Modulos

| Modulo | Capa | Responsabilidad | Depende de | Expone |
|--------|------|-----------------|------------|--------|
| db | core | Setup SQLite, migrations, queries tipadas | — | conexion, queries tipadas |
| ffmpeg | core | Detectar FFmpeg, probe metadata, spawn con progress | — (FFmpeg sidecar) | probe(), spawn() |
| patterns | core | Parse/format naming conventions, auto-detect patron | — | parse(), format(), detect() |
| scanner | core | Readdir recursivo, probe paralelo, import pipeline | db, ffmpeg, patterns | scan() |
| trips | core | Gap detection, agrupacion, compatibilidad codecs | db | groupClips(), getTrip() |
| exporter | core | Concat lossless / re-encode, progress, templates | db, ffmpeg, trips | export() |
| thumbnails | core | Generacion y cache de thumbnails | db, ffmpeg | generate(), get() |
| monitor | core | Deteccion SD/USB, auto-scan, re-import | scanner | watch(), stop() |
| cli | cli | Interfaz terminal (commands) | todos los core | commands tipados |
| ipc | electron | Bridge main-renderer, preload, tipos | todos los core | handlers tipados |

## Boundaries

1. Cada modulo expone una interfaz publica en `src/interfaces/<module>.ts`
2. Comunicacion solo via interfaces — no imports directos entre implementaciones
3. `db` es el unico modulo que toca SQLite directamente
4. `ffmpeg` es el unico modulo que hace spawn de procesos FFmpeg/FFprobe
5. Modulos core no dependen de cli, electron, ni renderer

## Grafo de dependencias (core)

```
db ←─── scanner ←── monitor
│        ↑
ffmpeg ──┤
│        ↓
│      exporter
│        ↑
patterns trips
          ↑
      thumbnails
```

### Capas

```
fundacional:  db, ffmpeg, patterns  (sin deps core)
orquestacion: scanner, trips, thumbnails, exporter, monitor
consumidores: cli, ipc
```

## Diagrama de dependencias

### Interfaces (compile-time imports en src/interfaces/)

```
scanner.ts ──→ trips.ts (Clip)
```

Todos los demas archivos de interfaces son autocontenidos.

### Implementacion (runtime, inyectadas)

```
db ←─── scanner ←── monitor
│        ↑
ffmpeg ──┤
│        ↓
│      exporter
│
patterns  trips ←── thumbnails
```

### Verificacion de ciclos

Sin dependencias circulares en ninguna capa.

## Interfaces publicas (src/interfaces/)

| Archivo | Tipos principales |
|---------|-------------------|
| db.ts | DatabaseConfig, MigrationResult, DbError, DbModule |
| ffmpeg.ts | ProbeResult, SpawnOptions, FfmpegProgress, FfmpegError, FfmpegModule |
| patterns.ts | Pattern, ParseResult, FormatOptions, PatternError, PatternsModule |
| scanner.ts | ScanOptions, ScanResult, ScanProgress, ScannerError, ScannerModule |
| trips.ts | Clip, Trip, GroupOptions, TripError, TripsModule |
| exporter.ts | ExportOptions, ExportProgress, ExportTemplate, ExporterError, ExporterModule |
| thumbnails.ts | ThumbnailConfig, ThumbnailEntry, ThumbnailError, ThumbnailsModule |
| monitor.ts | WatchOptions, MonitorEvent, MonitorError, MonitorModule |
| index.ts | Barrel re-export de todos los modulos |

## Contratos
TODO: Paso 1.4
