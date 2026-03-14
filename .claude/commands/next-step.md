---
description: "Cargar contexto y ejecutar siguiente etapa del pipeline"
---

1. Lee STATUS.md -> fase, paso, etapa
2. Lee sub-plan indicado
3. Carga SOLO archivos en "Contexto necesario"

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
- **DISENAR:** Proponer diseno. Esperar aprobacion.
- **BUILD-OR-BUY:** Buscar libs. Recomendar build/buy/hibrido.
- **VIABILIDAD:** Verificar factibilidad con stack.
- **COMPATIBILIDAD:** Verificar contra interfaces. make test-contracts.
- **IMPLEMENTAR:** Codigo segun diseno.
- **TEST:** make check.
- **ACEPTACION:** Resumen para aprobacion.
- **CIERRE:** Ejecutar /close-step.

Actualizar STATUS.md con nueva etapa al terminar.
NO avanzar sin confirmacion.
