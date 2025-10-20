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
COPY package.json ./
RUN npm install --only=production && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3002/health || exit 1
CMD ["node", "dist/main.js"]