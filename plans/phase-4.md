# Fase 4: V1 Producto Usable

## Objetivo
Producto completo para usuario no-tecnico. GPS, player mejorado, monitor, robustez.

## Contexto requerido
- MVP funcional (Fase 3)

## Pasos

### GPS & Mapa
- 4.1 GPS extraction: metadata embebida + .srt/.nmea
- 4.2 Mapa Leaflet + OpenStreetMap sincronizado con playback
- 4.3 Export GPX/KML como archivo companion

### Player mejorado
- 4.4 Velocidad de reproduccion (1x, 2x, 4x, 8x)
- 4.5 Seamless playback: transicion continua entre clips
- 4.6 Keyboard shortcuts: espacio, flechas, J/K/L

### Export avanzado
- 4.7 Timestamp overlay burn-in (drawtext filter, configurable)
- 4.8 Chapter markers en MP4 (1 chapter por clip original)
- 4.9 Export parcial: rango temporal dentro de una sesion

### Monitor & auto-process
- 4.10 Trigger monitor: detectar SD/USB, auto-scan, configurable
- 4.11 Re-import inteligente: detectar clips existentes, solo nuevos

### Robustez
- 4.12 Archivos desconectados (verificar al abrir, estado gris)
- 4.13 Clips corruptos/truncados (indicador visual, excluir/incluir)
- 4.14 Cancelacion de operaciones (kill FFmpeg, estado consistente)
- 4.15 Virtualizacion de listas (react-window) para 5000+ clips
- 4.16 Error boundaries, mensajes legibles, fallbacks visuales

## Gate
- [ ] GPS funcional con mapa sincronizado
- [ ] Player con shortcuts y velocidad variable
- [ ] Monitor detecta SD/USB
- [ ] App estable con 5000+ clips
