# Fase 2: Core Engine (sin UI)

## Objetivo
Implementar pipeline completo FFmpeg end-to-end con clips reales.
Validar performance y compatibilidad antes de construir UI.

## Contexto requerido
- src/interfaces/
- docs/architecture.md

## Pasos

### Paso 2.1: db.ts — SQLite setup
- **Input:** Interfaces de db
- **Output:** Modulo db con migrations, seed de builtin patterns
- **Criterio de done:** Tests pasan, schema correcto
- **Estado:** [ ]

### Paso 2.2: ffmpeg.ts — Detectar/descargar FFmpeg
- **Input:** Interfaces de ffmpeg
- **Output:** Modulo con detect, probe(), spawn con progress
- **Criterio de done:** Probe funciona con clip real
- **Estado:** [ ]

### Paso 2.3: patterns.ts — Parse/format con date-fns
- **Input:** Interfaces de patterns
- **Output:** detectPattern() contra muestra, ~10 builtin patterns
- **Criterio de done:** >90% deteccion en clips de fabricantes populares
- **Estado:** [ ]

### Paso 2.4: scanner.ts — Readdir recursivo
- **Input:** Interfaces de scanner
- **Output:** Scan con max depth 6, probe paralelo (CPU/2)
- **Criterio de done:** 2000 clips en <30s
- **Estado:** [ ]

### Paso 2.5: trips.ts — Gap detection
- **Input:** Interfaces de trips
- **Output:** Agrupacion por gap temporal, compatibilidad codecs, naming
- **Criterio de done:** Viajes detectados correctamente en set de prueba
- **Estado:** [ ]

### Paso 2.6: exporter.ts — Concat lossless
- **Input:** Interfaces de exporter
- **Output:** Concat lossless + re-encode, progress via stderr
- **Criterio de done:** Export lossless funciona con dashcams populares
- **Estado:** [ ]

### Paso 2.7: Test end-to-end
- **Input:** Todos los modulos
- **Output:** Script de test con clips reales
- **Criterio de done:** Pipeline completo scan→detect→group→export OK
- **Estado:** [ ]

## Kill criteria
- Probe de 2000 clips en <30s
- Concat lossless funciona con clips de dashcams populares
- Pattern detection identifica fabricante correctamente en >90% de casos

## Gate
- [ ] Todos los modulos implementados y testeados
- [ ] Kill criteria cumplidos
- [ ] `make test` pasa
