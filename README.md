# dashcam-toolkit

App desktop cross-platform (Electron + React + TypeScript) y CLI para procesar videos de dashcam. Universal (multi-fabricante), con auto-agrupacion de viajes, preview sin renderizar, y concatenacion lossless.

Core puro Node.js consumido por CLI (power users) y UI grafica (usuarios no-tecnicos).

## Stack

| Componente  | Tecnologia                            |
| ----------- | ------------------------------------- |
| Runtime     | Node.js >=20 + TypeScript (ES2022)    |
| CLI         | Commander.js v14                      |
| DB          | SQLite (better-sqlite3 + Drizzle ORM) |
| FFmpeg      | ffmpeg-static, spawn directo          |
| UI          | Electron + React + electron-vite      |
| Test        | Vitest                                |
| Lint/Format | ESLint v10 + Prettier                 |
| Pre-commit  | Husky v9                              |

## Requisitos

- Node.js >= 20
- npm

## Inicio rapido

```bash
git clone <repo-url>
cd dashcam-toolkit
make setup    # Instala deps, rebuild native, compila todo
```

Despues de `make setup`:

```bash
make start    # Abre la app Electron (produccion local)
make dev      # Abre la app Electron en dev mode (HMR)
make cli args="scan /ruta/dashcam"   # Usa el CLI
```

## Comandos

```bash
# Setup
make setup          # Instalar deps + rebuild native + compilar todo

# Desarrollo
make dev            # Electron dev mode (HMR)
make dev-cli        # CLI en watch mode (tsc --watch)

# Build
make build          # Compilar core + CLI (tsc)
make build-electron # Compilar Electron app (electron-vite build)

# Ejecucion
make start          # Abrir Electron app compilada
make cli args="..." # Correr CLI compilado (ej: make cli args="scan /ruta")

# Calidad
make check          # Lint + format + build + tests
make lint           # ESLint
make lint-fix       # ESLint + autofix
make format         # Prettier --write
make format-check   # Prettier --check
make typecheck      # tsc --noEmit
make test           # Vitest
make test-watch     # Vitest en watch mode
make test-contracts # Tests de contrato
make test-e2e       # Tests end-to-end

# Git
make commit m="tipo(scope): msg"  # Commit con pre-commit hooks
make push                         # Push a remote

# Otros
make clean          # Borrar dist/ y out/
make changelog      # Generar CHANGELOG.md
make status         # Mostrar estado actual del proyecto
make plan           # Mostrar indice del plan
make help           # Listar todos los comandos
```

## Estructura

```
src/
  interfaces/     # Contratos publicos (locked, cambios requieren RFC)
  core/
    modules/      # Puro Node.js — db, ffmpeg, scanner, patterns,
                  #   trips, exporter, thumbnails, monitor
  cli/            # Interfaz terminal (Commander.js)
  main/           # Electron main process
  preload/        # Electron preload (IPC bridge)
  renderer/       # Electron renderer (React)
  shared/         # Tipos compartidos
tests/
  unit/           # Tests unitarios por modulo
  contracts/      # Tests de contrato (interfaces)
  e2e/            # Tests end-to-end
docs/
  architecture.md # Arquitectura y decisiones de producto
  interfaces.md   # Modulos, boundaries, contratos
plans/            # Sub-planes por fase y decisiones
```

## Modulos

| Modulo     | Responsabilidad                                     |
| ---------- | --------------------------------------------------- |
| db         | SQLite setup, migrations, queries tipadas           |
| ffmpeg     | Detectar FFmpeg, probe metadata, spawn con progress |
| patterns   | Parse/format naming conventions, auto-detect        |
| scanner    | Readdir recursivo, probe paralelo, import pipeline  |
| trips      | Gap detection, agrupacion, compatibilidad codecs    |
| exporter   | Concat lossless / re-encode, progress, templates    |
| thumbnails | Generacion y cache de thumbnails                    |
| monitor    | Deteccion SD/USB, auto-scan, re-import              |

## Estado

- **Fase 0:** Stack y Scaffolding — completada
- **Fase 1:** Interfaces y Modulos — completada
- **Fase 2:** Core Engine + CLI — completada
- **Fase 3:** Electron + UI — en progreso

## Licencia

MIT
