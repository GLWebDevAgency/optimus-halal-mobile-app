# ── Build Stage ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install deps first (Docker layer caching)
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate \
  && pnpm install --frozen-lockfile

# Build TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
COPY asset/ ./asset/
RUN pnpm run build

# Copy migration files (needed by preDeployCommand and dist/db/migrate.js)
COPY drizzle/ ./drizzle/

# Prune dev deps for production
RUN pnpm prune --prod

# ── Production Stage ────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

# Copy only production node_modules + compiled JS (minimal image)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "--max-old-space-size=512", "--optimize-for-size", "dist/index.js"]
