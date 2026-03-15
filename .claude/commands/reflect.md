---
description: "Revisar correcciones capturadas y convertirlas en aprendizajes del proyecto"
---

## Argumentos
- Sin argumentos: flujo normal (pasos 1-5)
- `--dedupe`: buscar duplicados y contradicciones en aprendizajes aplicados (paso 6)
- `--scan-history`: escanear sesiones pasadas por correcciones perdidas (paso 1.1)
- `--days N`: limitar scan a los ultimos N dias (default: 30). Solo con --scan-history.

## 0. Verificar argumentos

Si el usuario paso `--dedupe`, ir directamente al paso 6.
Si `--scan-history`, continuar al paso 1 y luego paso 1.1.
Si no, flujo normal (saltear paso 1.1).

## 1. Cargar cola de aprendizajes
Lee `.planning/learnings/queue.md`.
- Si no existe o esta vacio: "No hay correcciones pendientes. Nada que hacer."
- Si tiene entradas: continuar.

## 1.1 Escanear historial de sesiones (solo con --scan-history)

### Ubicar archivos de sesion
Determinar el directorio de sesiones del proyecto:
- Path del proyecto: directorio de trabajo actual (pwd)
- Codificar path: reemplazar `/` con `-`, quitar `-` inicial
- Directorio de sesiones: `~/.claude/projects/-[PATH_CODIFICADO]/`
- Buscar archivos `*.jsonl`, filtrar por `--days N` (default: 30 dias)

Si no hay archivos: "No se encontraron sesiones para este proyecto en los ultimos N dias."

### Extraer correcciones de sesiones
Para cada archivo de sesion, leer y buscar mensajes del usuario (role: "user") que matcheen patrones de correccion:
- Explicitos: "remember:", "recuerda:"
- Correcciones fuertes: "no uses", "don't", "actually", "stop", "never", "always", "I told you"
- Rechazos de herramientas: mensajes donde el usuario bloqueo una accion y dio feedback correctivo

Saltear:
- Mensajes marcados como `isMeta: true`
- Mensajes muy largos (>500 chars) sin markers explicitos

### Agregar a la cola de trabajo
Para cada correccion extraida, agregar como fila a la cola de trabajo.
Deduplicar contra entradas existentes en queue.md y applied.md.

Mostrar resumen:
```
Scan de sesiones: X sesiones analizadas (ultimos N dias)
  - Y correcciones potenciales encontradas
  - Z ya en queue/applied (omitidas)
  - W nuevas entradas agregadas
```

Continuar al paso 1.5 con la cola enriquecida.

## 1.5 Validacion semantica

Para cada entrada en la cola, analizar semanticamente:

### Filtrar falsos positivos
Descartar silenciosamente si la correccion es:
- Una pregunta disfrazada ("por que usaste X?" sin proponer alternativa)
- Un reporte de bug ("esto falla", "hay un error en...")
- Un pedido de tarea ("agrega un test para...", "implementa...")
- Una confirmacion simple ("ok", "si", "dale", "listo")
- Una instruccion de un solo uso, no generalizable

Este paso soporta cualquier idioma — analizar la intencion, no solo keywords.

### Extraer aprendizaje accionable
Para cada entrada valida, reescribir como frase imperativa concisa:
- Entrada: "no no, en realidad mejor usa Zod para eso, no uses Joi"
- Aprendizaje: "Usar Zod en vez de Joi para validacion de schemas"

### Ajustar confianza
Evaluar confianza semantica (0.0-1.0) basada en:
- **Claridad**: es especifica? menciona herramientas/patrones concretos? (+)
- **Generalidad**: aplica siempre o solo en este caso? (+)
- **Enfasis**: el usuario fue enfatico (repeticion, "te dije que", "siempre")? (+)

### Actualizar entradas
- Entradas validas: anotar aprendizaje reescrito
- Entradas descartadas: eliminar de la cola

Mostrar resumen antes de continuar:
```
Validacion semantica: X entradas analizadas
  - Y confirmadas como aprendizajes
  - Z descartadas (falsos positivos)
```

## 2. Revisar cada entrada
Para cada correccion validada, delegar al agente learning-extractor.
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

## 6. Deduplicacion (solo con --dedupe)

### 6.1 Cargar destinos
Leer todos los archivos que contienen aprendizajes aplicados:
- CLAUDE.md
- docs/conventions.md (si existe)
- plans/decisions.md (si existe)
- .claude/rules/*.md

### 6.2 Extraer entradas
Para cada archivo, extraer las lineas/bullet points que representan reglas, convenciones o decisiones individuales.

### 6.3 Detectar duplicados semanticos
Agrupar entradas que:
- Refieren a la misma herramienta, patron o concepto
- Dan consejos redundantes o solapados
- Podrian fusionarse sin perder informacion

### 6.4 Detectar contradicciones
Buscar entradas que se contradigan:
- "Usar X" vs "No usar X"
- "Siempre hacer Y" vs "Nunca hacer Y"

### 6.5 Presentar hallazgos
```
══════════════════════════════════════════
DEDUPLICACION
══════════════════════════════════════════

CONTRADICCIONES (si hay):
  archivo:linea "Regla A"
  archivo:linea "Regla B"
  -> Descripcion del conflicto

ENTRADAS SIMILARES (si hay):
  Grupo 1:
    archivo:linea "Entrada A"
    archivo:linea "Entrada B"
    -> Propuesta consolidada: "Texto unificado"

Entradas unicas: N (sin cambios necesarios)
══════════════════════════════════════════
```

### 6.6 Aplicar con aprobacion
- Para cada contradiccion: preguntar al usuario cual conservar
- Para cada grupo similar: preguntar si aplicar la version consolidada
- Aplicar cambios aprobados con Edit
- `make commit m="learn: deduplicate learnings"`
