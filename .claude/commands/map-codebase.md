---
description: "Analizar codebase existente -- standalone, sin iniciar workflow"
---

Util para analizar un proyecto sin arrancar el workflow completo.
Si queres iniciar claude-pw en un proyecto existente, usa `/startup` (detecta brownfield automaticamente).

## 1. VERIFICAR
Hay codigo fuente? Si no: "Proyecto vacio. Usa /startup para greenfield."

## 2. ANALIZAR
Delegar al agente codebase-mapper. Esperar reporte completo.

## 3. REVISAR
Presentar reporte seccion por seccion. Preguntar si quiere ajustar.

## 4. ESCRIBIR DOCS
Distribuir en archivos:
- **docs/architecture.md**: Stack + Arquitectura
- **docs/codebase-map.md**: Estructura
- **docs/conventions.md**: Convenciones
- **docs/tech-debt.md**: Concerns

Si ya existen con contenido real (no TODO), preguntar antes de sobreescribir.

## 5. COMMIT
`make commit m="docs: codebase mapping"`
