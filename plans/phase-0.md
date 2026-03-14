# Fase 0: Stack y Scaffolding

## Objetivo
Definir tecnologias, estructura, toolchain, y setup del entorno de desarrollo.
Scaffold como proyecto Node.js + TS puro (Electron se agrega en Fase 3).

## Contexto requerido
- PLAN.md
- docs/architecture.md

## Pasos

### Paso 0.1: Definicion de stack
- **Input:** Plan maestro del usuario
- **Output:** docs/architecture.md completo
- **Criterio de done:** Documento aprobado con stack, estructura, y decisiones
- **Estado:** [x]

### Paso 0.2: Scaffold Node.js + TS
- **Requiere:** 0.1
- **Input:** docs/architecture.md
- **Output:** Proyecto TS funcional (compila, estructura de directorios creada)
- **Criterio de done:** `make build` compila, `npx dashcam --help` responde
- **Estado:** [x]

### Paso 0.3: Skills y MCPs
- **Requiere:** 0.1, 0.2
- **Input:** docs/architecture.md, stack definido, modulos identificados
- **Output:** Lista de skills/MCPs instalados, docs/tooling.md con justificacion
- **Criterio de done:** Skills/MCPs instalados y verificados funcionando
- **Estado:** [x]
- **Notas:** Evaluar SQLite MCP, filesystem tools. Solo lo que tenga uso claro.

### Paso 0.4: Makefile + toolchain + changelog
- **Requiere:** 0.3
- **Input:** Stack + estructura + skills instalados
- **Output:** Makefile completo, configs lint/format/test, changelog tooling
- **Criterio de done:** `make lint`, `make test`, `make build` OK
- **Estado:** [ ]

### Paso 0.5: Pre-commit + CI/CD + versionado
- **Requiere:** 0.4
- **Input:** Toolchain configurada
- **Output:** Pre-commit hook, pipeline CI, semver
- **Criterio de done:** Pre-commit bloquea commits rotos, CI corre en push
- **Estado:** [ ]

### Paso 0.6: Setup Claude Code
- **Requiere:** 0.5
- **Input:** Todo lo anterior
- **Output:** CLAUDE.md, rules, commands, agents ajustados al stack real
- **Criterio de done:** /next-step funciona correctamente
- **Estado:** [ ]

## Gate
- [ ] `make check` pasa
- [ ] `make build` compila
- [ ] `npx dashcam --help` responde
- [ ] Pre-commit bloquea commits rotos
- [ ] Claude Code tooling funcional
