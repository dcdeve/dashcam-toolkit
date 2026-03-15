---
description: "Discutir detalles de implementacion antes de construir -- capturar preferencias y resolver ambiguedades"
---

## 1. Cargar contexto de fase

Lee STATUS.md para determinar la fase actual. Carga el sub-plan (`plans/phase-N.md`).
Si no hay fase activa, usar PLAN.md como contexto.

## 2. Identificar areas grises

Analizar el scope de la fase y clasificar ambiguedades en categorias:

- **Visual/UX**: layout, interacciones, estados vacios, responsive
- **Data/API**: formatos, endpoints, errores, paginacion, cache
- **Arquitectura**: patrones, abstracciones, estructura de carpetas, state management
- **Comportamiento**: edge cases, reglas de validacion, defaults, manejo de errores
- **Integracion**: servicios externos, auth, librerias de terceros

Solo incluir categorias que tengan ambiguedades genuinas.

## 3. Presentar categorias

```
Areas grises identificadas para Fase N:

1. [Arquitectura] Como estructurar la capa de datos?
2. [Comportamiento] Que pasa cuando falla la validacion en forms multi-step?
3. [Integracion] Que provider de auth usar?

Cuales queres discutir? (numeros, "todas", o "saltar")
```

Si dice "saltar": "Sin discusion necesaria. Continua con /next-step."

## 4. Loop de discusion

Para cada area seleccionada:
- Hacer preguntas enfocadas (max 3 por area)
- Esperar respuesta antes de pasar a la siguiente
- Capturar cada decision
- Si el usuario menciona ideas fuera del scope de la fase, anotarlas como diferidas

Mantener las discusiones cortas — el objetivo es resolver ambiguedades, no re-planificar.

## 5. Generar archivo de contexto

Escribir `plans/phase-N-context.md`:

```markdown
# Fase N — Contexto de discusion

## Decisiones
- [Decision]: [que se decidio y razon breve]

## Referencias canonicas
- [path/al/archivo] — [por que importa para la implementacion]

## Diferido
- [idea o preocupacion para una fase posterior]
```

Si no hay items diferidos, omitir esa seccion.

## 6. Actualizar STATUS.md

Agregar `plans/phase-N-context.md` a la lista de "Contexto necesario" en STATUS.md para que /next-step lo cargue automaticamente.

Reportar: "Discusion capturada en `plans/phase-N-context.md`. Corre /next-step para empezar."
