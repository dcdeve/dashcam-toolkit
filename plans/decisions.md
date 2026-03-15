# Decisiones

| # | Fase | Decision | Alternativas | Razon | Impacto | Fecha |
|---|------|----------|-------------|-------|---------|-------|
| 1 | Startup | Electron + React + TS | Tauri, Qt | Ecosistema npm, FFmpeg sidecar facil, cross-platform probado | Stack completo | 2026-03-14 |
| 2 | Startup | SQLite (better-sqlite3) | IndexedDB, LevelDB | Persistencia robusta, queries SQL, sync access en main process | Modelo de datos | 2026-03-14 |
| 3 | Startup | date-fns para tokens de fecha | moment, dayjs, Temporal | Ligero, tree-shakeable. Temporal no estable en Node.js aun | Pattern matching | 2026-03-14 |
| 4 | Startup | Archivos in-place (no copia) | Copiar a directorio interno | Dashcams generan muchos GB, copiar duplica espacio | Storage | 2026-03-14 |
| 5 | Startup | UI metafora biblioteca | File explorer | Usuarios no-tecnicos, organizacion por viajes | UX | 2026-03-14 |
| 6 | Startup | Dual video swap para preview | Concat real para preview | Evita renderizado, instantaneo | Performance | 2026-03-14 |
| 7 | Startup | Prioridad robustez sobre velocidad | Move fast | Dev solo, proyecto a largo plazo | Proceso | 2026-03-14 |
| 8 | 0.1-spike | ffmpeg-static + spawn directo | @ffmpeg-installer, fluent-ffmpeg | fluent-ffmpeg archivado mayo 2025. ffmpeg-static mas mantenido | FFmpeg | 2026-03-14 |
| 9 | 0.1-spike | electron-vite + electron-builder | electron-forge | Forge plugin Vite experimental. electron-vite tiene HMR nativo | Build tooling | 2026-03-14 |
| 10 | 0.1-spike | Drizzle ORM sobre better-sqlite3 | Raw SQL, Kysely, Prisma | Type safety en queries, migrations manejables. Prisma overkill | DB layer | 2026-03-14 |
| 11 | 0.1-spike | Vitest | Jest | 10-20x mas rapido en watch, nativo ESM/TS, comparte config Vite | Testing | 2026-03-14 |
| 12 | 0.1-spike | electron-log | winston, pino | IPC main/renderer nativo, file transport, config minima | Logging | 2026-03-14 |
| 13 | 0.1 | CLI-first, Electron despues | Electron desde el inicio | Core puro Node.js testeable sin Electron. CLI util por si sola | Arquitectura | 2026-03-14 |
| 14 | 0.1-spike | Commander.js v14 | yargs, citty | 238M dl/sem, 0 deps, battle-tested. citty v0.2 riesgoso para dev solo | CLI framework | 2026-03-14 |
| 15 | 0.1-spike | listr2 + cli-progress | ora, progress | listr2 para multi-fase, cli-progress para % FFmpeg. Complementarios | Progress UI | 2026-03-14 |
| 16 | 3.1 | src/main/ + src/preload/ (convencion electron-vite) | src/electron/ (custom) | Zero config, alineado con comunidad Electron, docs/ejemplos aplican directo. Custom paths no aportan valor real | Estructura | 2026-03-15 |
| 17 | 3.1 | Monolito con separacion logica | Monorepo multi-package | Dev solo, overhead de monorepo no justificado. Boundaries por carpeta permiten split futuro si crece comunidad | Arquitectura | 2026-03-15 |
| 18 | 3.1 | vitest@3.2 (downgrade de 4.1) | vitest@4 + legacy-peer-deps | electron-vite@5 requiere vite <=7, vitest@4 usa vite@8. Downgrade limpio sin breaking changes | Testing | 2026-03-15 |

| 16 | 1 | Lock de interfaces: cambios a src/interfaces/ requieren RFC previo | — | Proceso | 2026-03-15 |

## RFC en Interfaces

Desde Fase 1 Paso 1.5 (2026-03-15), las interfaces en `src/interfaces/` estan locked.
Cualquier modificacion requiere:
1. RFC en esta tabla con modulo, cambio propuesto, y justificacion
2. Aprobacion antes de implementar
3. Actualizar docs/interfaces.md y tests/contracts/ junto con el cambio

| # | Modulo | Cambio | Estado | Fecha |
|---|--------|--------|--------|-------|
| RFC-1 | trips | `id: number` → `id: string` en Clip, Trip, y parámetros de TripsModule. DB ya usa text UUIDs, scanner inserta con crypto.randomUUID(). Alinear interface con realidad. | aprobado | 2026-03-15 |
| RFC-2 | exporter | `tripIds?: number[]` → `tripIds?: string[]` en ExportOptions. Extension de RFC-1 para consistencia con IDs string. | aprobado | 2026-03-15 |
