# dashcam-toolkit

App desktop cross-platform (Electron + React + TypeScript) y CLI para procesar videos de dashcam. Universal (multi-fabricante), con auto-agrupacion de viajes, preview sin renderizar, y concatenacion lossless.

Core puro Node.js consumido por CLI (power users) y UI grafica (usuarios no-tecnicos).

## Stack

| Componente | Tecnologia |
|-----------|-----------|
| Runtime | Node.js + TypeScript (ES2022) |
| CLI | Commander.js v14 |
| DB | SQLite (better-sqlite3 + Drizzle ORM) |
| FFmpeg | ffmpeg-static, spawn directo |
| UI (futuro) | Electron + React |
| Test | Vitest |
| Lint/Format | ESLint v10 + Prettier |

## Estructura

```
src/
  interfaces/     # Contratos publicos (locked, cambios requieren RFC)
  core/           # Puro Node.js — modulos: db, ffmpeg, scanner, patterns,
    modules/      #   trips, exporter, thumbnails, monitor
  cli/            # Interfaz terminal
  shared/         # Tipos compartidos
tests/
  unit/           # Tests unitarios por modulo
  contracts/      # Tests de contrato (interfaces)
  e2e/            # Tests end-to-end
docs/
  architecture.md # Arquitectura y decisiones de producto
  interfaces.md   # Modulos, boundaries, diagramas, contratos
plans/            # Sub-planes por fase y decisiones
```

## Modulos

| Modulo | Responsabilidad |
|--------|----------------|
| db | SQLite setup, migrations, queries tipadas |
| ffmpeg | Detectar FFmpeg, probe metadata, spawn con progress |
| patterns | Parse/format naming conventions, auto-detect |
| scanner | Readdir recursivo, probe paralelo, import pipeline |
| trips | Gap detection, agrupacion, compatibilidad codecs |
| exporter | Concat lossless / re-encode, progress, templates |
| thumbnails | Generacion y cache de thumbnails |
| monitor | Deteccion SD/USB, auto-scan, re-import |

## Comandos

```bash
make check          # Lint + format + typecheck + tests
make lint           # ESLint
make format-check   # Prettier check
make typecheck      # tsc --noEmit
make test           # Vitest
make test-contracts # Tests de contrato
make commit m="..."  # Commit con pre-commit hooks
make push           # Push a remote
```

## Estado

- **Fase 0:** Stack y Scaffolding — completada
- **Fase 1:** Interfaces y Modulos — completada
- **Fase 2:** Core Engine + CLI — pendiente
- **Fase 3:** Electron + UI — pendiente

## Licencia

TBD
