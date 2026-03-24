.DEFAULT_GOAL := help

.PHONY: setup
setup: ## Instalar deps, rebuild native, compilar todo
	npm install
	npx electron-rebuild -f -w better-sqlite3
	npx tsc
	npx electron-vite build

.PHONY: build
build: ## Compilar TypeScript (core + CLI)
	npx tsc

.PHONY: build-electron
build-electron: ## Compilar Electron app
	npx electron-vite build

.PHONY: dev
dev: ## Abrir Electron en dev mode
	npx electron-rebuild -f -w better-sqlite3
	npx electron-vite dev

.PHONY: dev-cli
dev-cli: ## Compilar CLI en watch mode
	npx tsc --watch

.PHONY: start
start: ## Abrir Electron app compilada (produccion local)
	nohup npx electron . > /dev/null 2>&1 &
	@echo "App launched (PID $$!)"

.PHONY: cli
cli: ## Correr CLI compilado (make cli args="scan /ruta")
	node dist/cli/index.js $(args)

.PHONY: test
test: ## Correr tests
	ELECTRON_RUN_AS_NODE=1 npx electron ./node_modules/.bin/vitest run

.PHONY: test-watch
test-watch: ## Correr tests en watch mode
	ELECTRON_RUN_AS_NODE=1 npx electron ./node_modules/.bin/vitest

.PHONY: lint
lint: ## Lint
	npx eslint src/

.PHONY: lint-fix
lint-fix: ## Lint + fix
	npx eslint src/ --fix

.PHONY: format
format: ## Format con prettier
	npx prettier --write 'src/**/*.{ts,tsx}'

.PHONY: format-check
format-check: ## Verificar formato
	npx prettier --check 'src/**/*.{ts,tsx}'

.PHONY: typecheck
typecheck: ## Verificar tipos sin emitir
	npx tsc --noEmit

.PHONY: test-contracts
test-contracts: ## Correr tests de contrato
	ELECTRON_RUN_AS_NODE=1 npx electron ./node_modules/.bin/vitest run tests/contracts/ --passWithNoTests

.PHONY: test-e2e
test-e2e: ## Correr tests end-to-end
	ELECTRON_RUN_AS_NODE=1 npx electron ./node_modules/.bin/vitest run tests/e2e/ --passWithNoTests

.PHONY: check
check: lint format-check build test ## Validacion completa

.PHONY: clean
clean: ## Borrar dist/ y out/
	rm -rf dist/ out/

.PHONY: changelog
changelog: ## Generar CHANGELOG.md desde commits
	npx changelogen --output CHANGELOG.md

.PHONY: release
release: ## Bump version + changelog (make release t="patch|minor|major")
	npx changelogen --release --push --$(t)

.PHONY: status
status: ## Mostrar estado actual
	@cat STATUS.md

.PHONY: plan
plan: ## Mostrar indice del plan
	@cat PLAN.md

.PHONY: commit
commit: ## Commit (make commit m="tipo(scope): msg")
	git add -A
	git commit -m "$(m)"

.PHONY: push
push: ## Push
	git push

.PHONY: help
help: ## Ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[0;32m%-20s\033[0m %s\n", $$1, $$2}'
