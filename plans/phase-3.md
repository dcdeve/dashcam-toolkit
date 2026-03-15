# Fase 3: Electron + UI

## Objetivo
App usable con workflows basicos: import → browse → preview → export.
Electron como shell visual sobre el core ya validado por CLI.

## Contexto requerido
- Core engine + CLI funcional (Fase 2)
- src/interfaces/

## Pasos

### Paso 3.1: Electron shell + electron-vite
- **Input:** Proyecto Node.js existente
- **Output:** Electron wrapping el core, ventana vacia, build OK
- **Criterio de done:** `make dev` abre ventana, core accesible desde main process
- **Estado:** [x]

### Paso 3.2: IPC bridge + preload + tipos compartidos
- **Input:** Interfaces de ipc
- **Output:** Bridge main↔renderer tipado
- **Criterio de done:** Llamada IPC funcional de renderer a main
- **Estado:** [x]

### Paso 3.3: Import flow
- **Input:** Scanner + patterns
- **Output:** File dialog → pattern confirmation → progress bar
- **Criterio de done:** Import de carpeta con deteccion automatica
- **Estado:** [x]

### Paso 3.4: Library — Clips tab
- **Input:** DB + thumbnails
- **Output:** Grid/lista con toggle, thumbnails, ordenable por columnas
- **Criterio de done:** Vista funcional con datos reales
- **Estado:** [x]

### Paso 3.5: Library — Viajes tab
- **Input:** Trips + thumbnails
- **Output:** TripCards con hover scrub / tabla ordenable
- **Criterio de done:** Hover scrub latencia <50ms
- **Estado:** [x]

### Paso 3.6: Thumbnails
- **Input:** FFmpeg + clips
- **Output:** 1 por clip + ~30 por viaje, cache en disco
- **Criterio de done:** Generacion y cache funcional
- **Estado:** [x]

### Paso 3.7: Player — Modo clip
- **Input:** Clip seleccionado
- **Output:** <video> estandar con controles
- **Criterio de done:** Reproduce clip correctamente
- **Estado:** [x]

### Paso 3.8: Player — Modo viaje
- **Input:** Trip con clips
- **Output:** Dual video swap, seek bar global, clip N/total, timestamp
- **Criterio de done:** Swap gap <100ms
- **Estado:** [x]

### Paso 3.9: Export flow
- **Input:** Exporter + UI
- **Output:** Resumen (lossless vs re-encode), progress bar, "Abrir carpeta"
- **Criterio de done:** Export completo desde UI
- **Estado:** [x]

### Paso 3.10: Settings
- **Input:** DB settings
- **Output:** Export dir, gap minutes, FFmpeg path, patterns CRUD, export template
- **Criterio de done:** Settings persistidos entre sesiones
- **Estado:** [x]

### Paso 3.11: Compression presets
- **Input:** Exporter
- **Output:** CRF + preset como opciones legibles (Alta/Media/Baja, Rapido/Balanceado/Max)
- **Criterio de done:** Presets aplicados correctamente en export
- **Estado:** [x]

## Gate
- [ ] Workflow completo import→browse→preview→export funcional
- [ ] Hover scrub <50ms, swap gap <100ms
- [ ] Settings persistidos
- [ ] `make build` genera app funcional
