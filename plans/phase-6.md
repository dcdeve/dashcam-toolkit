# Fase 6: Features Avanzados (priorizado por impacto)

## Objetivo
Features diferenciadores, priorizados segun demanda e impacto.

## Contexto requerido
- V1 distribuida (Fase 5)

## Multi-cam
- 6.1 Detectar pares front/rear por timestamp
- 6.2 Preview sincronizada multi-cam
- 6.3 Export layouts: PiP, side-by-side, mosaic
- 6.4 Camera exclusion en export

## GPU acceleration
- 6.5 Detectar GPU (NVIDIA, Intel QSV, Apple Silicon, VAAPI)
- 6.6 Hardware encoder cuando disponible
- 6.7 Fallback automatico a software encoding

## Deteccion de eventos
- 6.8 G-sensor: picos de aceleracion → markers en timeline
- 6.9 Audio: deteccion de volumen alto
- 6.10 Motion-only mode: fast-forward sin movimiento

## Export inteligente
- 6.11 Presets contextuales (seguros, YouTube, compresion)
- 6.12 Timelapse generator
- 6.13 Speed overlay GPS
- 6.14 FPS control en export

## Busqueda y organizacion
- 6.15 Busqueda por fecha, duracion, resolucion
- 6.16 Busqueda por ubicacion GPS
- 6.17 Heatmap de rutas frecuentes
- 6.18 Nombre editable de viajes

## IA (experimental)
- 6.19 ONNX Runtime local para deteccion de objetos
- 6.20 Auto-highlights: paisajes, animales, maniobras
- 6.21 Auto-generar highlights reel

## Gate
- [ ] Priorizar por feedback de usuarios reales
