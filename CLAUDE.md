# dashcam-toolkit

## Stack
- **Runtime:** Node.js + TypeScript (ES2022, Node16 modules)
- **CLI:** Commander.js v14 + @commander-js/extra-typings
- **DB:** SQLite (better-sqlite3 + Drizzle ORM)
- **FFmpeg:** ffmpeg-static, child_process.spawn directo
- **Test:** Vitest
- **Lint:** ESLint v10 + typescript-eslint (strict)
- **Format:** Prettier
- **Pre-commit:** Husky v9
- **CI:** GitHub Actions (make check en push/PR)
- **Changelog:** changelogen (conventional commits)
- **Build:** tsc (futuro: electron-vite + electron-builder)

## Reglas
- Leer STATUS.md antes de cualquier cosa
- STATUS.md dice que sub-plan cargar -- no cargar otros
- No modificar archivos fuera del scope del paso actual
- No modificar src/interfaces/ sin RFC en plans/decisions.md
- Usar `make` para todos los comandos
- Despues de cada etapa, actualizar STATUS.md
- Pipeline adaptativo: evaluar que etapas aplican al inicio del paso
- Etapas obligatorias: DISENAR, ACEPTACION, CIERRE
- Si hay incertidumbre tecnica -> SPIKE (explorar y descartar codigo)
- NUNCA git commit --no-verify
- Decisiones grandes -> /impact -> context reset
- Tareas ad-hoc que no afectan el plan -> /quick
- Debug que puede tomar varias sesiones -> /debug (persiste estado)
- Si algo parece roto o inconsistente -> /health
- Si el usuario te corrige, captura la correccion en .planning/learnings/queue.md
- Al final de sesiones largas, sugerir /reflect para procesar aprendizajes

## Estructura
- STATUS.md -- Puntero. Leer primero.
- PLAN.md -- Indice
- plans/ -- Sub-planes (solo fase actual)
- plans/decisions.md -- Decisiones y RFC
- src/interfaces/ -- Contratos (RFC para modificar)
- .planning/ -- Estado local (gitignored): quick tasks, debug sessions
