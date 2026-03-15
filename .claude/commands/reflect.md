---
description: "Revisar correcciones capturadas y convertirlas en aprendizajes del proyecto"
---

## 1. Cargar cola de aprendizajes
Lee `.planning/learnings/queue.md`.
- Si no existe o esta vacio: "No hay correcciones pendientes. Nada que hacer."
- Si tiene entradas: continuar.

## 2. Revisar cada entrada
Para cada correccion en la cola, delegar al agente learning-extractor.
El agente clasifica y propone destino:
- **REGLA**: nueva regla o ajuste a CLAUDE.md / .claude/rules/
- **CONVENCION**: documentar en docs/conventions.md
- **DECISION**: registrar en plans/decisions.md
- **PIPELINE**: ajustar etapas default en next-step o startup
- **DESCARTAR**: no es generalizable, era caso puntual

## 3. Presentar al usuario
Mostrar cada propuesta con preview del cambio:
```
1. [REGLA] "Usar X en vez de Y para Z" -> CLAUDE.md
2. [CONVENCION] "Imports siempre con alias @/" -> docs/conventions.md
3. [DESCARTAR] "Typo en variable" -> no aplica
```
Esperar aprobacion item por item (o "aplicar todos").

## 4. Aplicar cambios aprobados
- Escribir al destino correspondiente
- Marcar como procesados en queue.md
- `make commit m="learn: apply session learnings"`

## 5. Limpiar
Mover entradas procesadas a `.planning/learnings/applied.md` con fecha.
