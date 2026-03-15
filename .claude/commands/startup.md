---
description: "Sesion de discovery -- detecta modo (greenfield/brownfield/bluefield), entrevista y genera plan"
---

## 0. DETECCION DE MODO

Verificar el estado del directorio:
- Hay archivos fuente? (src/, lib/, app/, *.py, *.ts, *.go, etc.)
- Hay git history? (mas de 3 commits)
- Hay package manager? (package.json, requirements.txt, go.mod, Cargo.toml, etc.)

Si NO hay codigo:
- Modo **GREENFIELD** automatico. Ir a paso 1.

Si HAY codigo, preguntar:
```
Detecte un proyecto existente ([stack detectado], [N archivos], [N commits]).
Que queres hacer?

1. BROWNFIELD — Sumar estructura claude-pw a este proyecto tal cual
2. BLUEFIELD — Reescribir o reemplazar partes de este proyecto
3. GREENFIELD — Ignorar codigo existente, arrancar de cero
```

## 0.5 SCAN (solo brownfield/bluefield)

Delegar al agente codebase-mapper. Esperar reporte.
Pre-llenar contexto con findings:
- Stack -> detectado
- Modulos -> inferidos del codigo
- Convenciones -> detectadas
- Integraciones -> detectadas
- Tech debt -> identificada (relevante para bluefield)

Escribir docs/ con el reporte (misma logica que /map-codebase pasos 3-4).

---

## 1. CONTEXTO INICIAL

**Greenfield**: Pedi al usuario que describa el proyecto libremente. No interrumpas.

**Brownfield**: Presentar sintesis del scan. Preguntar: "Esto refleja bien el proyecto? Que falta o que esta mal?"

**Bluefield**: Presentar sintesis del scan + preguntar: "Que partes queres reescribir y por que? Que se mantiene?"

## 2. ENTREVISTA ESTRUCTURADA

MAXIMO 3-4 preguntas por turno. Adaptar segun modo:

### Greenfield (6 rondas completas)

**Ronda 1 -- Problema y objetivo:**
- Que problema resuelve este proyecto?
- Quien lo va a usar?
- Hay algo existente que estemos reemplazando o es completamente nuevo?

**Ronda 2 -- Alcance:**
- Que debe poder hacer en la primera version (v1)?
- Que explicitamente NO debe hacer? (limites)
- Hay deadline o constraint de tiempo?

**Ronda 3 -- Componentes y arquitectura:**
- Que partes logicas ves? (si no sabe, propone modulos basados en lo que describio)
- Hay integraciones externas? (APIs, DBs, servicios terceros)
- Preferencia de arquitectura? (monolito, servicios, serverless, etc.)

**Ronda 4 -- Stack y constraints tecnicos:**
- Lenguaje/framework preferido o abierto a propuestas?
- Infra? (cloud, local, docker, etc.)
- Hay tech ya decidida o prohibida?

**Ronda 5 -- Tooling y aceleradores:**
- Hay dominios donde un skill o MCP server ayudaria?
- Ya usas algun MCP server o skill de Claude Code?
- Preferis mantenerlo minimo o estas abierto a instalar herramientas que aceleren?

**Ronda 6 -- Contexto de desarrollo:**
- Trabajas solo o en equipo?
- Prioridad: velocidad de entrega vs robustez?

### Brownfield (2 rondas — el scan cubre el resto)

**Ronda 1 -- Objetivo:**
- Que queres lograr ahora con este proyecto? (feature nuevo, refactor, mejora?)
- Hay scope definido para lo proximo?
- Hay deadline o constraint?

**Ronda 2 -- Gaps:**
- El scan detecto bien la arquitectura? Algo que corregir?
- Hay decisiones no documentadas que deberia saber?
- Skills/MCPs utiles para lo que viene?

### Bluefield (3 rondas)

**Ronda 1 -- Motivacion:**
- Por que reescribir? (tech debt, nuevo requisito, cambio de stack, compliance?)
- Que se mantiene del sistema actual? (datos, APIs publicas, UI?)
- Que se descarta?

**Ronda 2 -- Target:**
- Como deberia verse el sistema nuevo?
- Cambio de stack? Si/No y por que
- Estrategia: big bang o migracion gradual?

**Ronda 3 -- Constraints:**
- Hay que mantener backward compatibility? Con que?
- Deadline para la migracion?
- Skills/MCPs utiles?

Si el usuario no sabe algo, marcalo como "decision pendiente para Fase 0".
No bombardees -- si una ronda se responde parcialmente, adapta la siguiente.

## 3. SINTESIS
Produci un resumen estructurado:

```
### Modo: [GREENFIELD | BROWNFIELD | BLUEFIELD]

### Vision
[2-3 oraciones]

### Modulos identificados
- [modulo]: [responsabilidad]

### Scope v1
- Incluye: [lista]
- Excluye: [lista]

### Constraints y decisiones ya tomadas
- [decision]: [razon]

### Skills y MCPs a evaluar en Fase 0
- [skill/MCP]: [para que se usaria]
- (o "ninguno identificado por ahora")

### Pendiente para Fase 0
- [lo que falta decidir]
```

**Bluefield extra:**
```
### Plan de migracion
- Mantener: [lo que no se toca]
- Reescribir: [modulos a reemplazar]
- Estrategia: [big bang | gradual]
- Backward compat: [si/no + detalles]
```

Presentalo al usuario. NO avances sin aprobacion.

## 3.5 AUTO-RESEARCH (si aplica)
Revisar la sintesis. Para cada item en "Pendiente para Fase 0" y decisiones tecnicas inciertas:
- Si es "que libreria/framework usar" -> delegar al agente researcher (tipo: library)
- Si es "es viable este approach" -> delegar al agente researcher (tipo: feasibility)
- Si es preferencia/decision de negocio -> skip (necesita humano)

Guardar resultados en docs/research/. Presentar resumenes junto con la sintesis.
Si no hay nada que investigar, skip esta seccion.

## 4. GENERACION DEL PLAN
Una vez aprobada la sintesis, genera:

1. **PLAN.md** -- Indice: descripcion, modulos, tabla de fases, archivos clave
2. **plans/phase-0.md** -- Stack y Scaffolding
   - Greenfield: completa (6 pasos)
   - Brownfield: adaptada (skip pasos cubiertos por scan, ej: stack ya detectado)
   - Bluefield: incluye pasos de migracion (setup nuevo + bridge con viejo)
3. **plans/phase-1.md** -- Interfaces y Modulos (siempre)
4. **plans/phase-2+.md** -- Una fase por modulo identificado (borrador si falta info)
   - Bluefield: fases de migracion por modulo (viejo -> nuevo)
5. **plans/decisions.md** -- Con decisiones tomadas en el startup
6. **docs/architecture.md** -- Borrador (greenfield) o actualizado (brownfield/bluefield)
7. **STATUS.md** -- Apuntando a Fase 0, Paso 0.1, Etapa DISENAR

## 5. REVIEW DEL PLAN
Presenta el plan fase por fase para revision:
- Primero PLAN.md (indice completo)
- Luego cada sub-plan, uno por uno
- Espera aprobacion/ajuste en cada uno antes de pasar al siguiente
- Actualiza archivos con los ajustes

## 6. COMMIT Y ARRANQUE
- `make commit m="chore: initial plan from startup ([modo])"`
- Reporta: "Plan generado. Corre /next-step para arrancar Fase 0."
