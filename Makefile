.PHONY: build up down restart mcp test dev up-dev down-dev

build:
	@echo "🔨 Building Next.js application..."
	@cd next-connect-ui && npm install && npm run build
	@echo "✅ Next.js build completed!"
	@echo ""
	@echo "🔨 Building Docker images..."
	@docker compose build --no-cache
	@echo "✅ Docker build completed successfully!"
	@echo "📌 Run 'make up' to start the server"

up:
	@echo "🚀 Starting LangConnect server..."
	@docker compose up -d
	@echo "✅ Server started successfully!"
	@echo "📌 Access points:"
	@echo "   - API Server: http://localhost:8080"
	@echo "   - API Docs: http://localhost:8080/docs"
	@echo "   - Next.js UI: http://localhost:3001"
	@echo "   - PostgreSQL: localhost:5432"

up-build:
	@echo "🔨 Building and starting LangConnect server..."
	@docker compose build --no-cache
	@docker compose up -d
	@echo "✅ Server built and started successfully!"
	@echo "📌 Access points:"
	@echo "   - API Server: http://localhost:8080"
	@echo "   - API Docs: http://localhost:8080/docs"
	@echo "   - Next.js UI: http://localhost:3001"
	@echo "   - PostgreSQL: localhost:5432"

down:
	@echo "🛑 Stopping LangConnect server..."
	@docker compose down
	@echo "✅ Server stopped successfully!"

restart:
	@echo "🔄 Restarting LangConnect server..."
	@docker compose down
	@docker compose up -d
	@echo "✅ Server restarted successfully!"

mcp:
	@echo "🔧 Creating MCP configuration..."
	@uv run python mcpserver/create_mcp_json.py
	@echo "✅ MCP configuration created successfully!"

TEST_FILE ?= tests/unit_tests

test:
	./run_tests.sh $(TEST_FILE)

dev:
	@echo "🚀 Starting LangConnect in development mode..."
	@docker compose -f docker-compose.dev.yml up -d
	@echo "✅ Development server started successfully!"
	@echo "📌 Access points:"
	@echo "   - API Server: http://localhost:8000"
	@echo "   - API Docs: http://localhost:8000/docs"
	@echo "   - Next.js UI: http://localhost:3001 (with hot reload)"
	@echo "   - PostgreSQL: localhost:5432"

up-dev:
	@echo "🚀 Starting LangConnect in development mode..."
	@docker compose -f docker-compose.dev.yml up -d
	@echo "✅ Development server started successfully!"
	@echo "📌 Access points:"
	@echo "   - API Server: http://localhost:8000"
	@echo "   - API Docs: http://localhost:8000/docs"
	@echo "   - Next.js UI: http://localhost:3001 (with hot reload)"
	@echo "   - PostgreSQL: localhost:5432"

down-dev:
	@echo "🛑 Stopping LangConnect development server..."
	@docker compose -f docker-compose.dev.yml down
	@echo "✅ Development server stopped successfully!"

