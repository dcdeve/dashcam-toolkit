# dashcam-toolkit

## Stack
Electron + React + TypeScript, SQLite (better-sqlite3), FFmpeg sidecar, date-fns

## Reglas
- Leer STATUS.md antes de cualquier cosa
- STATUS.md dice que sub-plan cargar -- no cargar otros
- No modificar archivos fuera del scope del paso actual
- No modificar src/interfaces/ sin RFC en plans/decisions.md
- Usar `make` para todos los comandos
- Despues de cada etapa, actualizar STATUS.md
- Pipeline adaptativo: evaluar que etapas aplican al inicio del paso
- Etapas obligatorias: DISENAR, ACEPTACION, CIERRE
- Si hay incertidumbre tecnica -> SPIKE (explorar y descartar codigo)
- NUNCA git commit --no-verify
- Decisiones grandes -> /impact -> context reset

## Estructura
- STATUS.md -- Puntero. Leer primero.
- PLAN.md -- Indice
- plans/ -- Sub-planes (solo fase actual)
- plans/decisions.md -- Decisiones y RFC
- src/interfaces/ -- Contratos (RFC para modificar)
