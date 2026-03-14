---
description: "Cargar contexto y ejecutar siguiente etapa del pipeline"
---

## 0. Health check (inicio de sesion)
Delegar al agente session-recovery en modo CHECK.
- Si LIMPIO: continuar.
- Si RECUPERABLE: mostrar acciones sugeridas. Preguntar: "Reparo automaticamente? (si/no)".
  - Si dice si: re-invocar session-recovery con REPAIR=true. Continuar.
  - Si dice no: mostrar acciones manuales. Esperar.
- Si INCONSISTENTE: mostrar diagnostico. NO continuar sin decision del usuario.

## 1. Cargar contexto
- Lee STATUS.md -> fase, paso, etapa
- Lee sub-plan indicado
- Carga SOLO archivos en "Contexto necesario"

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
- **SPIKE:** Definir pregunta + timebox. Explorar en subagent. Reportar resultado. Descartar codigo.
- **DISENAR:** Antes de proponer, verificar si hay unknowns tecnicos. Si los hay, delegar al agente researcher. Incorporar findings al diseno. Citar: "Basado en research (docs/research/[topic].md)". Luego proponer diseno. Esperar aprobacion.
- **BUILD-OR-BUY:** Delegar al agente researcher con tipo "library". El agente busca y compara opciones. Presentar findings con recomendacion. Esperar aprobacion.
- **VIABILIDAD:** Verificar factibilidad con stack.
- **COMPATIBILIDAD:** Verificar contra interfaces. make test-contracts.
- **IMPLEMENTAR:** Codigo segun diseno.
- **TEST:** make check.
- **ACEPTACION:** Resumen para aprobacion.
- **CIERRE:** Ejecutar /close-step.

Actualizar STATUS.md con nueva etapa al terminar.
NO avanzar sin confirmacion.
