---
description: "Debug persistente -- sesiones que sobreviven context resets"
---

Debug estructurado con estado persistente. No se pierde progreso entre sesiones.

## 1. VERIFICAR SESION ACTIVA
Verificar si existe `.planning/debug/active-session.md`.

### Si existe (resumir):
- Leer el archivo
- Mostrar al usuario: titulo, intentos usados, hipotesis actual, causas eliminadas
- Preguntar: "Continuar debug session? (si/no/cerrar)"
  - Si "cerrar": mover a `.planning/debug/resolved/[fecha]-[titulo-slug].md`. Fin.
  - Si "no": fin.
  - Si "si": continuar al paso 3.

### Si no existe (nueva sesion):
Continuar al paso 2.

## 2. NUEVA SESION
Preguntar: "Que bug estas investigando? Pega el error, describe el comportamiento, o indica el test que falla."

Crear `.planning/debug/active-session.md`:
```
# Debug: [titulo descriptivo]
Started: [fecha]
Attempts: 0/5

## Observacion
[lo que el usuario describio]

## Hipotesis
(pendiente)

## Causas eliminadas
(ninguna)

## Conclusion
(pendiente)
```

## 3. INVESTIGAR
Delegar al agente debugger con contexto aislado.
El agente:
- Lee el archivo de sesion
- Ejecuta el loop cientifico (observar, hipotetizar, testear, concluir)
- Escribe el estado actualizado al archivo ANTES de reportar
- Reporta resultado

## 4. EVALUAR RESULTADO

### Si CONFIRMED:
- Mostrar el fix propuesto al usuario
- Preguntar: "Aplico el fix?"
  - Si "si": implementar el fix, correr tests, commitear
  - Mover sesion a `.planning/debug/resolved/[fecha]-[titulo-slug].md`
  - Reportar: "Bug resuelto. Fix aplicado y commiteado."

### Si sin conclusion:
- Incrementar contador de attempts en el archivo
- Verificar contra el maximo (default: 5)
- Si hay intentos restantes:
  "Intento [N]/[max]. Causas eliminadas: [lista]. Queres continuar? (si/no/aumentar limite)"
- Si se agoto el limite:
  "Se agotaron los [max] intentos. Opciones: (a) aumentar limite, (b) escalar a /impact, (c) cerrar como no resuelto."

## 5. ENTRE SESIONES
Cuando el usuario vuelve (nuevo /debug o /next-step que detecta sesion activa):
- El archivo tiene todo el estado
- No se pierde nada con /clear o nueva sesion
- El agente retoma desde donde quedo
