---
description: "Guardar estado de sesion para retomar despues -- crear documento de handoff"
---

## 1. Capturar estado actual
- Leer STATUS.md (fase, paso, etapa)
- Leer progreso del sub-plan actual ([x] vs [ ])
- Verificar cambios sin commitear (`git status`)

## 2. Capturar contexto de sesion
Preguntar al usuario:
- "En que estabas trabajando?" (o inferir de la conversacion)
- "Hay blockers o decisiones pendientes?"
- "Algo que la proxima sesion deba saber?"

Si el usuario quiere saltear detalles, inferir del contexto de la conversacion.

## 3. Generar archivo de handoff
Escribir `.planning/handoff.md`:

```markdown
# Handoff de Sesion — [fecha]

## Estado
- Fase: N, Paso: X.Y, Etapa: [etapa]
- Progreso: X/Y pasos completos en la fase actual

## En que se estaba trabajando
- [descripcion del trabajo actual]

## Cambios sin commitear
- [lista de archivos modificados, o "ninguno"]

## Decisiones pendientes
- [blockers o preguntas abiertas]

## Notas para la proxima sesion
- [notas del usuario]
```

## 4. Manejar trabajo sin commitear
Si hay cambios sin commitear:
- Preguntar: "Commitear como WIP antes de pausar? (si/no)"
- Si si: `make commit m="wip([scope]): pause — [descripcion breve]"`
- Si no: dejar los cambios como estan (avisar que pueden perderse si se cambia de branch)

## 5. Confirmar
Reportar: "Sesion pausada. Handoff guardado en `.planning/handoff.md`."
Reportar: "Proxima sesion: corre /next-step — va a detectar el handoff y restaurar contexto."
