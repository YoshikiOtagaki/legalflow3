.PHONY: help install dev test lint format type-check clean

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pipenv install --dev

dev: ## Run development server
	pipenv run uvicorn main:app --reload --host 0.0.0.0 --port 8001

test: ## Run tests
	pipenv run pytest

lint: ## Run linting
	pipenv run flake8 .

format: ## Format code with black
	pipenv run black .

format-check: ## Check code formatting
	pipenv run black --check .

type-check: ## Run type checking
	pipenv run mypy .

clean: ## Clean up cache files
	find . -type d -name "__pycache__" -delete
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
