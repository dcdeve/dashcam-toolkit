---
description: "Ceremonia de cierre -- docs (si aplica), status, sub-plan, commit, push"
---

1. Se cambiaron interfaces/arquitectura/contratos?
   - Si -> actualizar docs correspondientes
   - No -> skip

2. Actualizar STATUS.md: nuevo puntero al siguiente paso, etapa DISENAR

3. Marcar [x] en sub-plan

4. `make commit m="tipo(scope): descripcion"`
   - Si pre-commit falla: arreglar, re-intentar

5. `make push`

Reportar: "Paso X.Y cerrado. Siguiente: Paso X.Z"
