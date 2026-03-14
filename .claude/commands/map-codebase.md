---
description: "Analizar codebase existente -- detectar stack, arquitectura, convenciones, deuda"
---

Para proyectos brownfield. Analiza el codigo existente y documenta todo.

## 1. DETECTAR BROWNFIELD
Verificar que hay codigo existente:
- Hay archivos en src/, lib/, app/, o equivalente?
- Hay git history (mas de 1 commit)?
- Hay package.json/requirements.txt/go.mod o equivalente?

Si no hay codigo: "Este proyecto parece greenfield. /map-codebase es para proyectos existentes. Usa /startup para arrancar de cero."

## 2. ANALIZAR
Delegar al agente codebase-mapper.
Esperar reporte completo.

## 3. REVISAR
Presentar el reporte al usuario seccion por seccion:
- Stack detectado
- Estructura y modulos
- Arquitectura
- Convenciones
- Integraciones
- Concerns

Preguntar por cada seccion si quiere ajustar o corregir algo.

## 4. ESCRIBIR DOCS
Con el reporte aprobado, distribuir en archivos:

- **docs/architecture.md**: Secciones Stack + Arquitectura del reporte. Sobreescribir el TODO placeholder.
- **docs/codebase-map.md**: Seccion Estructura del reporte.
- **docs/conventions.md**: Seccion Convenciones del reporte.
- **docs/tech-debt.md**: Seccion Concerns del reporte.

Si ya existen con contenido real (no TODO), preguntar antes de sobreescribir.

## 5. AJUSTAR FASE 0
Si plans/phase-0.md existe:
- Paso 0.1 (stack): Marcar como parcialmente cubierto. Anotar: "Stack detectado por /map-codebase. Validar y completar."
- Si ya hay toolchain (lint, format, test configurados): anotar en paso 0.4

## 6. COMMIT
`make commit m="docs: codebase mapping for existing project"`

Reportar: "Codebase mapeado. Los docs estan en docs/. Si es un proyecto nuevo con claude-pw, corre /startup — la entrevista va a usar estos docs como input."
