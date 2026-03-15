.DEFAULT_GOAL := help

.PHONY: build
build: ## Compilar TypeScript
	npx tsc

.PHONY: dev
dev: ## Compilar en watch mode
	npx tsc --watch

.PHONY: test
test: ## Correr tests
	npx vitest run

.PHONY: test-watch
test-watch: ## Correr tests en watch mode
	npx vitest

.PHONY: lint
lint: ## Lint
	npx eslint src/

.PHONY: lint-fix
lint-fix: ## Lint + fix
	npx eslint src/ --fix

.PHONY: format
format: ## Format con prettier
	npx prettier --write 'src/**/*.ts'

.PHONY: format-check
format-check: ## Verificar formato
	npx prettier --check 'src/**/*.ts'

.PHONY: typecheck
typecheck: ## Verificar tipos sin emitir
	npx tsc --noEmit

.PHONY: test-contracts
test-contracts: ## Correr tests de contrato
	npx vitest run tests/contracts/ --passWithNoTests

.PHONY: check
check: lint format-check build test ## Validacion completa

.PHONY: clean
clean: ## Borrar dist/
	rm -rf dist/

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
