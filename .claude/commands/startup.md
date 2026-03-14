---
description: "Sesion de discovery -- entrevistar al usuario y generar el plan del proyecto"
---

Este comando arranca un proyecto desde cero. Segui este flujo exacto:

## 1. CONTEXTO INICIAL
Pedi al usuario que describa el proyecto libremente. No interrumpas, deja que escriba.

## 2. ENTREVISTA ESTRUCTURADA
Hace preguntas organizadas por area. MAXIMO 3-4 preguntas por turno.

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
- Hay dominios especificos donde un skill o MCP server ayudaria? (ej: UI admin, video/audio processing, DB management, PDF generation)
- Ya usas algun MCP server o skill de Claude Code?
- Preferis mantenerlo minimo o estas abierto a instalar herramientas que aceleren?

**Ronda 6 -- Contexto de desarrollo:**
- Trabajas solo o en equipo?
- Repo existente o nuevo?
  - Si es existente con codigo: recomendar `/map-codebase` antes o durante Fase 0
  - Si ya se corrio /map-codebase: leer docs/architecture.md, docs/codebase-map.md, etc. e incorporar a la sintesis
- Prioridad: velocidad de entrega vs robustez?

Si el usuario no sabe la respuesta a algo, esta bien. Marcalo como "decision pendiente para Fase 0" y segui.
No bombardees -- si una ronda se responde parcialmente, adapta la siguiente.

## 3. SINTESIS
Produci un resumen estructurado:

```
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
2. **plans/phase-0.md** -- Stack y Scaffolding (ajustado a lo que ya se decidio)
3. **plans/phase-1.md** -- Interfaces y Modulos (siempre)
4. **plans/phase-2+.md** -- Una fase por modulo identificado (borrador si falta info)
5. **plans/decisions.md** -- Con decisiones tomadas en el startup
6. **docs/architecture.md** -- Borrador con lo que se sabe del stack
7. **STATUS.md** -- Apuntando a Fase 0, Paso 0.1, Etapa DISENAR

## 5. REVIEW DEL PLAN
Presenta el plan fase por fase para revision:
- Primero PLAN.md (indice completo)
- Luego cada sub-plan, uno por uno
- Espera aprobacion/ajuste en cada uno antes de pasar al siguiente
- Actualiza archivos con los ajustes

## 6. COMMIT Y ARRANQUE
- `make commit m="chore: initial plan from startup"`
- Reporta: "Plan generado. Corre /next-step para arrancar Fase 0."
