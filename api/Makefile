# ──────────────────────────────────────────────
# New Horizon API — Makefile
# Comandos simples para el día a día
# ──────────────────────────────────────────────

.PHONY: help dev build build-prod test lint migrate seed db-reset

help: ## Muestra esta ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Inicia servidor en modo desarrollo (hot reload)
	npx tsnd --respawn src/app.ts

build: ## Compila TypeScript a JS (dist/)
	npx tsc

build-prod: build ## Compila TypeScript (el entorno se elige al ejecutar, no al compilar)

start: ## Inicia servidor en producción (requiere APP_ENV=production en el entorno)
	node dist/app.js

test: ## Ejecuta todos los tests
	npx jest

test-watch: ## Ejecuta tests en modo watch
	npx jest --watch

test-coverage: ## Ejecuta tests con reporte de cobertura
	npx jest --coverage

lint: ## Verifica tipos con TypeScript (sin emitir)
	npx tsc --noEmit

migrate: ## Ejecuta migraciones pendientes
	npx sequelize-cli db:migrate

migrate-undo: ## Revierte la última migración
	npx sequelize-cli db:migrate:undo

seed: ## Ejecuta seeders
	npx sequelize-cli db:seed:all

db-reset: ## Reconstruye BD desde cero (migraciones + seeders)
	npx sequelize-cli db:migrate:undo:all && \
	npx sequelize-cli db:migrate && \
	npx sequelize-cli db:seed:all
