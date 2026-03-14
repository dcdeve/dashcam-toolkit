---
description: "Tarea rapida sin pipeline completo -- para ad-hoc que no afectan el plan"
---

Este comando es para tareas puntuales que NO justifican el pipeline completo.
NO tocar STATUS.md, PLAN.md, ni sub-planes. Esto vive fuera del plan.

## 1. DESCRIBIR
Pedir al usuario una descripcion corta de la tarea (1-2 oraciones).

## 2. EVALUAR TAMANIO
Antes de continuar, evaluar si esto es realmente quick:

Seniales de que NO es quick (recomendar /next-step):
- Toca mas de 3 archivos
- Requiere cambios en src/interfaces/ (necesita RFC)
- Afecta mas de un modulo
- Necesita entrada en plans/decisions.md
- Es una feature nueva, no un ajuste/fix

Si alguna aplica:
"Esto parece demasiado grande para quick mode. Recomiendo /next-step para que pase por el pipeline. Queres continuar con /quick de todas formas?"

Solo continuar si el usuario confirma.

## 3. DISENAR RAPIDO
Proponer en 3-5 bullets:
- Que se va a cambiar
- En que archivos
- Que approach

Esperar aprobacion. NO hacer diseño formal.

## 4. IMPLEMENTAR
Hacer el cambio.

## 5. VERIFICAR
- Ejecutar `make check` si existe
- Si no hay make check, correr los tests relevantes
- Si no hay tests, verificar manualmente que funciona

## 6. COMMIT
`make commit m="quick: [descripcion corta]"`

## 7. LOG
Agregar una linea a `.planning/quick/log.md`:

```
| [fecha] | [descripcion] | [archivos cambiados] | [hash corto del commit] |
```

Reportar: "Quick task completada. Si esto genero mas trabajo, considera agregarlo al plan con /next-step."
