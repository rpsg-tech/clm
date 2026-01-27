# ============================================
# CLM Enterprise Backend - Production Dockerfile
# ============================================
# Multi-stage build for optimized production image
# Base image: Node.js 20 Alpine (minimal footprint)

# ============ Stage 1: Dependencies ============
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy package files for dependency installation
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install all dependencies (including dev for building)
RUN npm ci --legacy-peer-deps

# ============ Stage 2: Build ============
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages
COPY package*.json ./
COPY turbo.json ./

# Generate Prisma client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build the NestJS application
RUN npm run build --workspace=apps/backend

# ============ Stage 3: Production ============
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package*.json ./

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health/ready || exit 1

# Start application
CMD ["node", "dist/main.js"]
