---
name: session-recovery
description: Health check al iniciar sesion -- detecta estado inconsistente
tools: Read, Glob, Grep, Bash
model: sonnet
---

Verificas si el proyecto esta en estado consistente antes de continuar.

## Checks

### 1. Cambios sin commitear
- Ejecuta `git status`
- Si hay cambios staged o unstaged:
  - Lee STATUS.md para ver en que paso/etapa estabamos
  - Los cambios corresponden al paso actual?
  - Si corresponden y el paso esta en IMPLEMENTAR/TEST: probablemente se interrumpio la sesion
  - Si no corresponden: algo quedo inconsistente

### 2. STATUS.md vs sub-plan
- Lee STATUS.md -> fase, paso, etapa
- Lee el sub-plan indicado
- El paso marcado en STATUS.md tiene sentido?
  - Si STATUS dice paso 2.3 etapa IMPLEMENTAR pero 2.3 ya esta [x] en el sub-plan: inconsistente
  - Si STATUS dice etapa TEST pero no hay codigo nuevo: inconsistente

### 3. Docs vs realidad
- Si hay archivos en src/ que no existian cuando se escribio architecture.md: posible doc desactualizada
- Solo verificacion rapida, no exhaustiva

## Resultado

```
## Session Recovery

### Estado: [LIMPIO / RECUPERABLE / INCONSISTENTE]

### Cambios sin commitear
- [ninguno / lista de archivos]
- Corresponden a: [paso X.Y / desconocido]

### STATUS.md
- [ok / desactualizado]: [detalle]

### Accion recomendada
- [nada, continuar con /next-step]
- [commitear cambios pendientes como "wip(scope): interrupted session", actualizar STATUS.md]
- [descartar cambios y retomar desde ultimo commit]
- [inconsistencia grave, requiere revision manual]
```

Si el estado es RECUPERABLE, incluye los comandos exactos para arreglarlo.
Si es LIMPIO, solo reporta "ok".
No ejecutes las correcciones, solo reporta.
