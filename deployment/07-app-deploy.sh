#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 7: Application Deployment
# Target: RHEL 9.x | Run as: clmadmin
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="/opt/clm/app"
REPO_URL="${CLM_REPO_URL:-https://github.com/rpsg-tech/clm.git}"
BRANCH="${CLM_BRANCH:-main}"

# ─── Pre-flight ──────────────────────────────────────────────────────────────
if [[ "$(whoami)" != "clmadmin" ]]; then
    warn "This script should run as 'clmadmin'. Current user: $(whoami)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ─── 1. Clone or Update Repository ──────────────────────────────────────────
info "Cloning/updating repository..."

if [[ -d "$APP_DIR/.git" ]]; then
    info "Repository exists, pulling latest..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard "origin/$BRANCH"
    git clean -fd
    log "Repository updated to latest $BRANCH"
else
    info "Cloning fresh from $REPO_URL..."
    # Remove directory contents if exists but isn't a git repo
    rm -rf "${APP_DIR:?}"/*
    git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$APP_DIR"
    log "Repository cloned"
fi

cd "$APP_DIR"

# ─── 2. Auto-Detect Project Structure ───────────────────────────────────────
info "Analyzing project structure..."

echo ""
echo "  ┌─────────────────────────────────────────────────────────┐"

# Check for Turborepo monorepo
if [[ -f "turbo.json" ]]; then
    echo "  │  ✅ Turborepo monorepo detected                        │"
fi

# Check workspaces
if jq -e '.workspaces' package.json &>/dev/null; then
    WORKSPACES=$(jq -r '.workspaces[]' package.json | tr '\n' ', ')
    echo "  │  ✅ npm workspaces: $WORKSPACES│"
fi

# Check backend
if [[ -f "apps/backend/package.json" ]]; then
    if grep -q "@nestjs/core" apps/backend/package.json; then
        echo "  │  ✅ Backend: NestJS (apps/backend)                     │"
    elif grep -q "express" apps/backend/package.json; then
        echo "  │  ✅ Backend: Express (apps/backend)                    │"
    else
        echo "  │  ✅ Backend: Node.js (apps/backend)                    │"
    fi
fi

# Check frontend
if [[ -f "apps/user-app/package.json" ]]; then
    if grep -q "next" apps/user-app/package.json; then
        echo "  │  ✅ Frontend: Next.js (apps/user-app)                  │"
        NEXTJS_STANDALONE=$(grep -c '"standalone"' apps/user-app/next.config.* 2>/dev/null || echo "0")
        if [[ "$NEXTJS_STANDALONE" -gt 0 ]]; then
            echo "  │  ✅ Next.js output: standalone                        │"
        fi
    fi
fi

# Check for Prisma
if find . -name "schema.prisma" -not -path "*/node_modules/*" | head -1 | grep -q .; then
    PRISMA_PATH=$(find . -name "schema.prisma" -not -path "*/node_modules/*" | head -1)
    echo "  │  ✅ Prisma ORM: $PRISMA_PATH│"
fi

# Check Node version
NODE_REQ=$(jq -r '.engines.node // "not specified"' package.json)
echo "  │  ✅ Node requirement: $NODE_REQ│"

echo "  └─────────────────────────────────────────────────────────┘"
echo ""

# ─── 3. Set Up Environment File ─────────────────────────────────────────────
info "Setting up environment file..."

if [[ -f "$APP_DIR/apps/backend/.env" ]]; then
    warn ".env already exists at apps/backend/.env — preserving it"
else
    if [[ -f "$SCRIPT_DIR/conf/env.production" ]]; then
        cp "$SCRIPT_DIR/conf/env.production" "$APP_DIR/apps/backend/.env"
        log "Production .env template copied to apps/backend/.env"
        warn "IMPORTANT: Edit apps/backend/.env and fill in actual values!"
        warn "  Especially: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, REDIS_URL"
        
        # Auto-fill from generated credential files if they exist
        if [[ -f /opt/clm/.pg-credentials ]]; then
            source /opt/clm/.pg-credentials 2>/dev/null || true
            if [[ -n "${DATABASE_URL:-}" ]]; then
                sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" "$APP_DIR/apps/backend/.env"
                log "DATABASE_URL auto-filled from PostgreSQL setup"
            fi
        fi
        
        if [[ -f /opt/clm/.redis-credentials ]]; then
            source /opt/clm/.redis-credentials 2>/dev/null || true
            if [[ -n "${REDIS_URL:-}" ]]; then
                sed -i "s|REDIS_URL=.*|REDIS_URL=\"${REDIS_URL}\"|" "$APP_DIR/apps/backend/.env"
                log "REDIS_URL auto-filled from Redis setup"
            fi
        fi
        
        # Generate JWT secrets
        JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)
        JWT_REFRESH=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$APP_DIR/apps/backend/.env"
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${JWT_REFRESH}|" "$APP_DIR/apps/backend/.env"
        log "JWT secrets auto-generated"
    else
        warn "No env.production template found. Create apps/backend/.env manually."
    fi
fi

# ─── 4. Install Dependencies ────────────────────────────────────────────────
info "Installing dependencies (npm ci)..."

# Set PUPPETEER_SKIP_DOWNLOAD to avoid downloading Chrome
export PUPPETEER_SKIP_DOWNLOAD=true
export NEXT_TELEMETRY_DISABLED=1

# Ensure tracking/environment variables don't skip devDependencies
export NODE_ENV=development

# Use npm ci for deterministic installs (prefers package-lock.json)
if [[ -f "package-lock.json" ]]; then
    npm ci --include=dev
else
    npm install
fi

log "Dependencies installed"

# ─── 5. Build All Applications ──────────────────────────────────────────────
info "Building all applications (turbo run build)..."

# Note: Next.js 15 requires NODE_ENV=production for next build to work correctly.
# If it's set to development (from our install phase), prerendering will fail.
export NODE_ENV=production

# Generate Prisma client first
npm run db:generate

# Build everything
npm run build

log "All applications built successfully"

# ─── 6. Prepare Next.js Standalone ──────────────────────────────────────────
info "Preparing Next.js standalone deployment..."

STANDALONE_DIR="$APP_DIR/apps/user-app/.next/standalone"
if [[ -d "$STANDALONE_DIR" ]]; then
    # Copy static files and public directory into standalone
    if [[ -d "$APP_DIR/apps/user-app/public" ]]; then
        cp -r "$APP_DIR/apps/user-app/public" "$STANDALONE_DIR/apps/user-app/public"
        log "Copied public/ to standalone"
    fi

    if [[ -d "$APP_DIR/apps/user-app/.next/static" ]]; then
        mkdir -p "$STANDALONE_DIR/apps/user-app/.next/static"
        cp -r "$APP_DIR/apps/user-app/.next/static" "$STANDALONE_DIR/apps/user-app/.next/"
        log "Copied .next/static/ to standalone"
    fi

    log "Next.js standalone deployment prepared"
else
    warn "Standalone output not found. Next.js may not have output:'standalone' configured."
fi

# ─── 7. Run Database Migrations ─────────────────────────────────────────────
info "Running database migrations..."

PRISMA_SCHEMA=$(find . -name "schema.prisma" -not -path "*/node_modules/*" -not -path "*/dist/*" | head -1)

if [[ -n "$PRISMA_SCHEMA" ]]; then
    npx prisma migrate deploy --schema="$PRISMA_SCHEMA"
    log "Database migrations applied"
else
    warn "No schema.prisma found, skipping migrations"
fi

# ─── 8. Seed Database (first deployment only) ───────────────────────────────
SEED_MARKER="/opt/clm/.seed-complete"
if [[ ! -f "$SEED_MARKER" ]]; then
    info "First deployment — running database seed..."
    if npm run db:seed 2>/dev/null; then
        touch "$SEED_MARKER"
        log "Database seeded successfully"
    else
        warn "Database seed failed or not configured. Continuing..."
    fi
else
    info "Database already seeded (marker exists), skipping"
fi

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 7: Application Deployment — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Repository:  $APP_DIR"
echo "  Backend:     $APP_DIR/apps/backend/dist/"
echo "  Frontend:    $APP_DIR/apps/user-app/.next/standalone/"
echo "  Env file:    $APP_DIR/apps/backend/.env"
echo ""
echo -e "  ${YELLOW}IMPORTANT: Review and update apps/backend/.env before starting!${NC}"
echo ""
echo "  Next: bash 08-pm2-setup.sh"
