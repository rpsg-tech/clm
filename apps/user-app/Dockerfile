# ============================================
# CLM Enterprise Frontend - Production Dockerfile
# ============================================
# Multi-stage build optimized for Next.js 15 standalone output
# Base image: Node.js 20 Alpine (minimal footprint)

# ============ Stage 1: Dependencies ============
FROM node:20-alpine AS deps

WORKDIR /app

# Install libc6-compat for Alpine compatibility
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY apps/user-app/package*.json ./apps/user-app/

# Install dependencies
RUN npm ci --legacy-peer-deps

# ============ Stage 2: Build ============
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY apps/user-app ./apps/user-app
COPY packages ./packages
COPY package*.json ./
COPY turbo.json ./

# Set production environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application with standalone output
RUN npm run build --workspace=apps/user-app

# ============ Stage 3: Production ============
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/apps/user-app/.next/standalone ./
COPY --from=builder /app/apps/user-app/.next/static ./apps/user-app/.next/static
COPY --from=builder /app/apps/user-app/public ./apps/user-app/public

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set port environment variable
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start Next.js server
CMD ["node", "apps/user-app/server.js"]
