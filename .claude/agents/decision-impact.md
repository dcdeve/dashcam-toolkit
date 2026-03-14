---
name: decision-impact
description: Impacto de decision en todo el plan
tools: Read, Glob, Grep
model: sonnet
---

Recibis una decision.

1. Lee PLAN.md -> fases y sub-planes
2. Lee CADA sub-plan
3. Lee src/interfaces/ si aplica

Reporta:
- Fases afectadas: Fase N, Paso N.X: [que cambia]
- Interfaces afectadas: [que cambia]
- Acciones requeridas: [lista]
- Fases NO afectadas

Exhaustivo pero conciso. No modificar nada.
