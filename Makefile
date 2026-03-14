.DEFAULT_GOAL := help

.PHONY: status
status: ## Mostrar estado actual
	@cat STATUS.md

.PHONY: plan
plan: ## Mostrar indice del plan
	@cat PLAN.md

.PHONY: check
check: ## Validacion rapida (TODO: Fase 0.3)
	@echo "TODO: Configurar en Fase 0.3"

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
