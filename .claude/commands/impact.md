---
description: "Analisis de impacto de decision en todo el plan"
---

PAUSA. No seguir implementando.

1. Documentar decision en plans/decisions.md
2. Delegar a subagent decision-impact:
   - Lee PLAN.md + TODOS sub-planes + src/interfaces/
   - Reporta fases/pasos afectados
3. Presentar impacto al usuario
4. Si aprueba:
   - Actualizar sub-planes afectados (solo pasos impactados)
   - Marcar: "Actualizado por Decision #N"
   - `make commit m="docs: impact analysis decision N"`
5. Context reset OBLIGATORIO -- /clear o nueva sesion
6. Retomar con /next-step
