# Skills y MCP Servers

## MCP Servers instalados

| Nombre | Paquete | Uso en el proyecto | Config |
|--------|---------|-------------------|--------|
| sqlite | mcp-server-sqlite-npx | Explorar/consultar DB SQLite durante desarrollo y debug | .mcp.json |
| context7 | @upstash/context7-mcp | Docs actualizadas de libs (Drizzle, Commander.js, etc.) | .mcp.json |

## Custom Skills (.claude/commands/)

| Skill | Descripcion |
|-------|-------------|
| /next-step | Cargar contexto y ejecutar siguiente etapa del pipeline |
| /close-step | Ceremonia de cierre: docs, status, sub-plan, commit, push |
| /new-phase | Cerrar fase: validar con agente, corregir si falta, resetear STATUS |
| /impact | Analisis de impacto de decision en todo el plan |
| /spike | Exploracion tecnica aislada (resultado es info, no codigo) |
| /interface-check | Verificar consistencia de interfaces |
| /startup | Sesion de discovery: entrevistar al usuario y generar plan |
| /debug | Debug persistente: sesiones que sobreviven context resets |
| /quick | Tarea rapida sin pipeline completo, para ad-hoc que no afectan el plan |
| /reflect | Revisar correcciones capturadas y convertirlas en aprendizajes |
| /health | Health check del proyecto: verificar y opcionalmente reparar estado |
| /map-codebase | Analizar codebase existente y producir documentacion estructurada |

## Custom Agents (.claude/agents/)

| Agente | Uso |
|--------|-----|
| session-recovery | Health check al inicio de sesion, detecta estado inconsistente |
| plan-checker | Status del proyecto sin contaminar contexto |
| decision-impact | Impacto de decision en todo el plan |
| spike-explorer | Exploracion tecnica aislada, prueba codigo y reporta viabilidad |
| researcher | Pre-planning research, investiga unknowns antes de disenar |
| debugger | Debug estructurado con metodo cientifico, persiste entre sesiones |
| interface-reviewer | Consistencia de interfaces |
| codebase-mapper | Analiza codebase existente y produce documentacion estructurada |
| phase-validator | Valida fase completa: docs, codigo, gate |
| learning-extractor | Analiza correcciones de sesion y extrae aprendizajes accionables |

## Evaluados y descartados

| Nombre | Razon |
|--------|-------|
| Filesystem MCP | Claude Code ya tiene Read/Write/Edit/Glob/Grep nativos |
| GitHub MCP | `gh` CLI disponible via Bash, suficiente para PRs/issues |

## Notas
- Solo instalar lo que tenga uso claro en el plan
- Revisar en cada fase si se necesita algo nuevo
- SQLite MCP apunta a ~/.dashcam-toolkit/dashcam.db (ajustar si cambia la path)
