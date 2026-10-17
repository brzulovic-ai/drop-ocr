.PHONY: help pull-model build up down restart logs dev install lint test clean

# Default goal
all: build up

help:
	@echo "Drop gere OCR - Management Commands"
	@echo "======================================"
	@echo "  make pull-model    Pull Hugging Face model / inference container image"
	@echo "  make build         Build Bun Web Application Docker image"
	@echo "  make up            Start all services (Web + HF Inference) via docker-compose"
	@echo "  make up-web        Start only the Bun OCR Web Application"
	@echo "  make down          Stop and remove all containers"
	@echo "  make restart       Restart docker compose services"
	@echo "  make logs          Tail real-time logs from docker compose services"
	@echo "  make dev           Start local development server with Bun"
	@echo "  make install       Install dependencies with Bun"
	@echo "  make lint          Run TypeScript type check"
	@echo "  make clean         Clean dist and local caches"

# Pull Hugging Face model container image requested by user
pull-model:
	@echo "==> Pulling Hugging Face Xiaomi-OCR-0 model image..."
	-docker pull hf.co/SeerRay-Lab/Xiaomi-OCR-0 || true
	@echo "==> Pulling Hugging Face Text Generation Inference runtime..."
	docker pull ghcr.io/huggingface/text-generation-inference:latest

# Build Bun Web App image
build:
	@echo "==> Building Drop gere OCR Docker image using Bun..."
	docker compose build

# Start services in background
up:
	@echo "==> Starting Drop gere OCR stack with Docker Compose..."
	docker compose up -d
	@echo "==> Application ready at http://localhost:3000"
	@echo "==> Hugging Face Inference endpoint at http://localhost:8000"

# Start only the web app (useful if running HF inference separately)
up-web:
	docker compose up -d ocr-web

# Stop services
down:
	@echo "==> Stopping Docker Compose services..."
	docker compose down

# Restart services
restart: down up

# Tail logs
logs:
	docker compose logs -f

# Local development with Bun
dev:
	bun run dev

# Install dependencies using Bun
install:
	bun install

# Run TypeScript checks
lint:
	bun run lint

# Clean build artifacts
clean:
	rm -rf dist node_modules/.vite
