# Decisiones

| # | Fase | Decision | Alternativas | Razon | Impacto | Fecha |
|---|------|----------|-------------|-------|---------|-------|
| 1 | Startup | Electron + React + TS | Tauri, Qt | Ecosistema npm, FFmpeg sidecar facil, cross-platform probado | Stack completo | 2026-03-14 |
| 2 | Startup | SQLite (better-sqlite3) | IndexedDB, LevelDB | Persistencia robusta, queries SQL, sync access en main process | Modelo de datos | 2026-03-14 |
| 3 | Startup | @ffmpeg-installer/ffmpeg (MVP) | FFmpeg estatico bundled | Simplicidad para MVP, migrar a auto-download en Fase 5 | Dependencia FFmpeg | 2026-03-14 |
| 4 | Startup | date-fns para tokens de fecha | moment, dayjs | Ligero, tree-shakeable, buen parse/format | Pattern matching | 2026-03-14 |
| 5 | Startup | Archivos in-place (no copia) | Copiar a directorio interno | Dashcams generan muchos GB, copiar duplica espacio | Storage | 2026-03-14 |
| 6 | Startup | UI metafora biblioteca | File explorer | Usuarios no-tecnicos, organizacion por viajes | UX | 2026-03-14 |
| 7 | Startup | Dual video swap para preview | Concat real para preview | Evita renderizado, instantaneo | Performance | 2026-03-14 |
| 8 | Startup | Prioridad robustez sobre velocidad | Move fast | Dev solo, proyecto a largo plazo | Proceso | 2026-03-14 |

## RFC en Interfaces

| # | Modulo | Cambio | Estado | Fecha |
|---|--------|--------|--------|-------|
