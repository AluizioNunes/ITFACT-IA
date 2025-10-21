# Build stage
FROM node:22-bookworm AS builder
WORKDIR /app
ENV NODE_ENV=development
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build


# Runtime stage
FROM node:22-bookworm
WORKDIR /app
ENV NODE_ENV=production
ENV AUTO_RELOAD=false
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY package.json ./
# Copiar node_modules (inclui dev deps) do builder para suportar modo dev
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://localhost:3000/health || exit 1
CMD ["sh", "-c", "if [ \"$AUTO_RELOAD\" = \"true\" ]; then exec npm run dev; else exec node dist/main.js; fi"]