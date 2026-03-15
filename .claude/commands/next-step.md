---
description: "Cargar contexto y ejecutar siguiente etapa del pipeline"
---

## 0. Health check (inicio de sesion)

### Deteccion de handoff
Si `.planning/handoff.md` existe:
- Mostrar el resumen del handoff al usuario
- Preguntar: "Retomar desde este handoff? (si/no)"
- Si si: cargar contexto del handoff, borrar el archivo, continuar
- Si no: borrar el archivo, continuar normalmente

### Recovery de sesion
Delegar al agente session-recovery en modo CHECK.
- Si LIMPIO: continuar.
- Si RECUPERABLE: mostrar acciones sugeridas. Preguntar: "Reparo automaticamente? (si/no)".
  - Si dice si: re-invocar session-recovery con REPAIR=true. Continuar.
  - Si dice no: mostrar acciones manuales. Esperar.
- Si INCONSISTENTE: mostrar diagnostico. NO continuar sin decision del usuario.

## 1. Cargar contexto
- Lee STATUS.md -> fase, paso, etapa
- Lee sub-plan indicado (plans/phase-N.md)
- Si existe `plans/phase-N-context.md` (de /discuss), cargarlo tambien
- Carga SOLO archivos en "Contexto necesario" — nada mas
- Lee `.planning/config.json` -> autoAdvance (off | auto | yolo) — si no existe, default: off

Si etapa = CORRECCION:
- Leer "Correcciones pendientes" de STATUS.md
- Mostrar la lista al usuario
- Resolver cada correccion una por una
- Despues de corregir todas: `make commit m="fix(phase-N): correcciones del validador"`
- Reportar: "Correcciones resueltas. Corre /new-phase para re-validar."
- NO avanzar de fase automaticamente -- el validador debe correr de nuevo

Si es INICIO DE PASO (etapa = DISENAR), evaluar pipeline adaptativo:

```
Pipeline para Paso [X.Y]:
- SPIKE: [ok / skip + razon]
- DISENAR: ok
- BUILD-OR-BUY: [ok / skip + razon]
- VIABILIDAD: [ok / skip + razon]
- COMPATIBILIDAD: [ok / skip + razon]
- IMPLEMENTAR: [ok / skip + razon]
- TEST: [ok / skip + razon]
- ACEPTACION: ok
- CIERRE: ok
```

Luego ejecutar la etapa actual:
- **SPIKE:** Definir pregunta + timebox. Explorar en subagent. Reportar resultado. Descartar codigo. Registrar hallazgos en plans/decisions.md si son relevantes.
- **DISENAR:** Antes de proponer, verificar si hay unknowns tecnicos. Si los hay, delegar al agente researcher. Incorporar findings al diseno. Citar: "Basado en research (docs/research/[topic].md)". Luego proponer diseno. Esperar aprobacion.
- **BUILD-OR-BUY:** Delegar al agente researcher con tipo "library". El agente busca y compara opciones. Presentar findings con recomendacion. Esperar aprobacion.
- **VIABILIDAD:** Verificar factibilidad con stack.
- **COMPATIBILIDAD:** Verificar contra interfaces. make test-contracts.
- **IMPLEMENTAR:** Codigo segun diseno.
- **TEST:** make check.
- **ACEPTACION:** Resumen para aprobacion.
- **CIERRE:**
  1. Se cambiaron interfaces/arquitectura/contratos? → actualizar docs correspondientes
  2. Actualizar STATUS.md: puntero al siguiente paso, etapa DISENAR
  3. Marcar [x] en sub-plan
  4. `make commit m="tipo(scope): descripcion"`
     - Si pre-commit falla: corregir, reintentar
  5. `make push`

Actualizar STATUS.md con nueva etapa al terminar.

## 2. Avance segun modo

Leer `autoAdvance` de `.planning/config.json` (default: "off"):

- **off**: NO avanzar sin confirmacion del usuario en cada etapa.
  Despues de CIERRE, reportar: "Paso X.Y cerrado. Siguiente: Paso X.Z"
- **auto**: Avanzar automaticamente entre etapas. Pausar SOLO en:
  - DISENAR (el usuario debe aprobar el diseno)
  - ACEPTACION (el usuario debe validar el resultado)
  - Si ocurre un error en cualquier etapa, PARAR y reportar.
  Despues de CIERRE, si hay mas pasos en la fase actual, continuar automaticamente.
  Si era el ultimo paso, reportar: "Fase completa. Corre /new-phase para validar."
- **yolo**: Avanzar automaticamente por todas las etapas. Pausar SOLO en:
  - CIERRE (para confirmar el commit message)
  - Si ocurre un error, PARAR y reportar.
  Despues de CIERRE, continuar automaticamente con el siguiente paso.
  Si era el ultimo paso, reportar: "Fase completa. Corre /new-phase para validar."

NUNCA auto-avanzar entre fases -- siempre requiere /new-phase.
Si el contexto se llena (3+ pasos auto-avanzados), sugerir /clear y re-invocar /next-step.
