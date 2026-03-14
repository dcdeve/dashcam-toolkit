---
description: "Cerrar fase -- validar con agente, corregir si falta, resetear STATUS.md"
---

## 1. Verificar sub-plan
- Todos los pasos deben estar [x] en plans/phase-N.md
- Si hay pasos pendientes: reportar y NO avanzar

## 2. Ejecutar phase-validator
Delegar al agente phase-validator con el numero de fase actual.
El agente valida: codigo, documentacion, consistencia, gate.
Esperar su reporte completo.

## 3. Evaluar resultado

### Si APROBADO:
- Actualizar PLAN.md (fase completada)
- `make commit m="chore: complete phase N"`
- `make push`
- Resetear STATUS.md:
  ```
  ## Ahora
  - Fase: [N+1]
  - Paso: [N+1].1
  - Etapa: DISENAR
  - Sub-plan: plans/phase-[N+1].md
  ## Contexto necesario
  - [minimo para nueva fase]
  ## Notas de sesion
  - (vacio)
  ```
- Recomendar /clear o nueva sesion

### Si CORRECCIONES NECESARIAS:
- NO cerrar la fase
- Actualizar STATUS.md a modo correccion:
  ```
  ## Ahora
  - Fase: N
  - Paso: N.fix
  - Etapa: CORRECCION
  - Sub-plan: plans/phase-N.md

  ## Correcciones pendientes
  1. [correccion del reporte del validador]
  2. ...

  ## Contexto necesario
  - [archivos que necesitan correccion]

  ## Notas de sesion
  - Phase-validator encontro [X] correcciones
  - Corregir y volver a correr /new-phase
  ```
- Reportar: "Fase N tiene correcciones pendientes. Corre /next-step para resolverlas, luego volve a correr /new-phase."
