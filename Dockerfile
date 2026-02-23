# ============================================================
# CONTROLPANEL - Production Dockerfile
# Multi-stage build: deps → build → production runner
#
# better-sqlite3 requires native compilation, so we install
# build tools in the deps stage and carry only the compiled
# node_modules into the final image.
# ============================================================

# ---- Stage 1: Install dependencies (with build tools) ----
FROM node:20-alpine AS deps

# Install build tools required for better-sqlite3 native addon
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

WORKDIR /app

# Copy only the package manifests first to leverage layer caching.
# If package*.json hasn't changed, npm ci can reuse the cache layer.
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for the build stage)
RUN npm ci

# ---- Stage 2: Build the Next.js application ----
FROM node:20-alpine AS builder

WORKDIR /app

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree
COPY . .

# Run the production build.
# next.config.mjs already has output: 'standalone' which creates
# .next/standalone — a self-contained server with minimal node_modules.
RUN npm run build

# ---- Stage 3: Production runner ----
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Disable telemetry in production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the standalone build output.
# The standalone directory contains:
#   - A minimal server.js entry point
#   - Only the node_modules actually used at runtime
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (CSS, images, fonts) served directly by Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy the public directory (favicon, icons, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create the data directory for the SQLite database.
# The database path is /app/data/controlpanel.db by convention.
# Mount a volume at /app/data in production to persist the database
# across container restarts.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

# Health check: poll the /api/health endpoint every 30 seconds.
# Allows 5 seconds to start, 3 retries before marking unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the standalone Next.js server.
# The standalone build copies server.js to /app/server.js automatically.
# NO_BROWSER=1 suppresses the auto-open behaviour from the wrapper script.
ENV NO_BROWSER=1
CMD ["node", "server.js"]
