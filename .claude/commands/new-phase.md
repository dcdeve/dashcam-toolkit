---
description: "Cerrar fase, resetear STATUS.md"
---

1. Verificar todos los pasos [x] en sub-plan
2. Ejecutar gate de fase
3. `make check-ci`
4. Si pasa:
   - Actualizar PLAN.md (completado)
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
5. Si falla: reportar sin avanzar
