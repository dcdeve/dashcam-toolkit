# Fase 2: Core Engine + CLI

## Objetivo
Implementar pipeline completo FFmpeg end-to-end con clips reales.
CLI funcional como primera interfaz de usuario.

## Contexto requerido
- src/interfaces/
- docs/architecture.md

## Pasos

### Paso 2.1: db — SQLite setup
- **Input:** Interfaces de db
- **Output:** Modulo db con migrations, seed de builtin patterns
- **Criterio de done:** Tests pasan, schema correcto
- **Estado:** [x]

### Paso 2.2: ffmpeg — Detectar FFmpeg + probe
- **Input:** Interfaces de ffmpeg
- **Output:** Modulo con detect, probe(), spawn con progress
- **Criterio de done:** Probe funciona con clip real
- **Estado:** [x]

### Paso 2.3: patterns — Parse/format con date-fns
- **Input:** Interfaces de patterns
- **Output:** detectPattern() contra muestra, ~10 builtin patterns
- **Criterio de done:** >90% deteccion en clips de fabricantes populares
- **Estado:** [x]

### Paso 2.4: scanner — Readdir recursivo + import
- **Input:** Interfaces de scanner
- **Output:** Scan con max depth 6, probe paralelo (CPU/2), auto-detect pattern
- **Criterio de done:** 2000 clips en <30s
- **Estado:** [ ]

### Paso 2.5: trips — Gap detection + agrupacion
- **Input:** Interfaces de trips
- **Output:** Agrupacion por gap temporal, compatibilidad codecs, naming
- **Criterio de done:** Viajes detectados correctamente en set de prueba
- **Estado:** [ ]

### Paso 2.6: exporter — Concat lossless + re-encode
- **Input:** Interfaces de exporter
- **Output:** Concat lossless + re-encode, progress via stderr
- **Criterio de done:** Export lossless funciona con dashcams populares
- **Estado:** [ ]

### Paso 2.7: CLI — scan command
- **Input:** scanner + patterns + trips + db
- **Output:** `dashcam scan <dir>` funcional (auto-detect, agrupacion, --rescan, --pattern, --gap)
- **Criterio de done:** Scan completo desde terminal
- **Estado:** [ ]

### Paso 2.8: CLI — export command
- **Input:** exporter + db
- **Output:** `dashcam export` funcional (trips, clips, --range, --reencode, --preset)
- **Criterio de done:** Export completo desde terminal
- **Estado:** [ ]

### Paso 2.9: CLI — comandos auxiliares
- **Input:** Core modules + db
- **Output:** `dashcam info`, `patterns`, `trips`, `config` funcionales
- **Criterio de done:** Todos los comandos responden correctamente
- **Estado:** [ ]

### Paso 2.10: Test end-to-end
- **Input:** CLI completa
- **Output:** Tests e2e con clips reales via CLI
- **Criterio de done:** Pipeline completo scan→trips→export via CLI OK
- **Estado:** [ ]

## Kill criteria
- Probe de 2000 clips en <30s
- Concat lossless funciona con clips de dashcams populares
- Pattern detection identifica fabricante correctamente en >90% de casos

## Gate
- [ ] CLI funcional end-to-end
- [ ] Kill criteria cumplidos
- [ ] `make test` pasa
