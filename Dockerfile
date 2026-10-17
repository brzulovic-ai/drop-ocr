# Multi-stage Bun Dockerfile for Drop gere OCR Web App
# Stage 1: Build Frontend Assets
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install dependencies with Bun
RUN bun install --frozen-lockfile || bun install

# Copy source code and build production bundle
COPY . .
RUN bun run build

# Stage 2: Minimal Production Runtime
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and package manifest
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Copy built frontend client assets
COPY --from=builder /app/dist ./dist

# Copy server code
COPY --from=builder /app/server.ts ./server.ts

# Non-root user for security
USER bun

EXPOSE 3000

# Run full-stack Express + Vite static server via native Bun runtime
CMD ["bun", "run", "server.ts"]
