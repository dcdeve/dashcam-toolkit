# Fase 3: MVP con UI

## Objetivo
App usable con workflows basicos: import → browse → preview → export.

## Contexto requerido
- Core engine funcional (Fase 2)
- src/interfaces/

## Pasos

### Paso 3.1: IPC bridge + preload + tipos compartidos
- **Input:** Interfaces de ipc
- **Output:** Bridge main↔renderer tipado
- **Criterio de done:** Llamada IPC funcional de renderer a main
- **Estado:** [ ]

### Paso 3.2: Import flow
- **Input:** Scanner + patterns
- **Output:** File dialog → pattern confirmation → progress bar
- **Criterio de done:** Import de carpeta con deteccion automatica
- **Estado:** [ ]

### Paso 3.3: Library — Clips tab
- **Input:** DB + thumbnails
- **Output:** Grid/lista con toggle, thumbnails, ordenable por columnas
- **Criterio de done:** Vista funcional con datos reales
- **Estado:** [ ]

### Paso 3.4: Library — Viajes tab
- **Input:** Trips + thumbnails
- **Output:** TripCards con hover scrub / tabla ordenable
- **Criterio de done:** Hover scrub latencia <50ms
- **Estado:** [ ]

### Paso 3.5: Thumbnails
- **Input:** FFmpeg + clips
- **Output:** 1 por clip + ~30 por viaje, cache en disco
- **Criterio de done:** Generacion y cache funcional
- **Estado:** [ ]

### Paso 3.6: Player — Modo clip
- **Input:** Clip seleccionado
- **Output:** <video> estandar con controles
- **Criterio de done:** Reproduce clip correctamente
- **Estado:** [ ]

### Paso 3.7: Player — Modo viaje
- **Input:** Trip con clips
- **Output:** Dual video swap, seek bar global, clip N/total, timestamp
- **Criterio de done:** Swap gap <100ms
- **Estado:** [ ]

### Paso 3.8: Export flow
- **Input:** Exporter + UI
- **Output:** Resumen (lossless vs re-encode), progress bar, "Abrir carpeta"
- **Criterio de done:** Export completo desde UI
- **Estado:** [ ]

### Paso 3.9: Settings
- **Input:** DB settings
- **Output:** Export dir, gap minutes, FFmpeg path, patterns CRUD, export template
- **Criterio de done:** Settings persistidos entre sesiones
- **Estado:** [ ]

### Paso 3.10: Compression presets
- **Input:** Exporter
- **Output:** CRF + preset como opciones legibles (Alta/Media/Baja, Rapido/Balanceado/Max)
- **Criterio de done:** Presets aplicados correctamente en export
- **Estado:** [ ]

## Gate
- [ ] Workflow completo import→browse→preview→export funcional
- [ ] Hover scrub <50ms, swap gap <100ms
- [ ] Settings persistidos
- [ ] `make build` genera app funcional
