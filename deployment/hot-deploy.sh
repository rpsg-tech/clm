#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Master Hot-Deploy (All-Angles)
# Target: RHEL 9.x | Run as: clmadmin
#
# Covers: Sync, Build, Standalone-Assets, DB Migrations, Nginx-Sync, PM2-Reload
# ==============================================================================
# ══════════════════════════════════════════════════════════════════════════════
# Version: 1.0.6 (Clean Reload Fix)
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

APP_DIR="/opt/clm/app"
BRANCH="main"
LOG_FILE="/opt/clm/logs/hot-deploy-$(date +%Y%m%d).log"

cd "$APP_DIR"

info "═══ CLM Enterprise: Robust Deploy Started ═══"

# ─── 1. Pre-flight Checks ──────────────────────────────────────────────────
info "Performing pre-flight checks..."
[[ ! -f "apps/backend/.env" ]] && err "Missing .env in apps/backend! Deployment aborted."
command -v npx >/dev/null 2>&1 || err "npx not found. Ensure Node.js is installed."
log "Pre-flight checks passed."

# ─── 2. Sync Repository ────────────────────────────────────────────────────
info "Syncing with $BRANCH branch..."
git fetch origin "$BRANCH"
# Save current commit for potential rollback
OLD_COMMIT=$(git rev-parse HEAD)
git reset --hard "origin/$BRANCH"
git clean -fd

# Check for root-owned traps that block clmadmin
if find apps/ -user root | grep -q .; then
    warn "FILES OWNED BY ROOT DETECTED in apps/ folder."
    warn "This will cause EACCES errors. Run 'sudo chown -R clmadmin:clmadmin $APP_DIR' as root."
fi

log "Repository synchronized (Commit: $(git rev-parse --short HEAD))"

# ─── 3. Dependencies & Build ───────────────────────────────────────────────
info "Installing dependencies & building (Turbo)..."
export PUPPETEER_SKIP_DOWNLOAD=true
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Ensure we have a local turbo for consistency
npm install --save-dev turbo || true

# Clean install with permission fallback
if ! npm ci --include=dev; then
    warn "npm ci failed (likely permission or lockfile drift), trying npm install..."
    npm install || err "Dependency installation failed. TIP: Run 'sudo chown -R clmadmin:clmadmin $APP_DIR' to fix permissions."
fi

# Build
if ! npx turbo run build; then
    warn "Build failed! Rolling back to $OLD_COMMIT"
    git reset --hard "$OLD_COMMIT"
    err "Deployment failed during build. TIP: Check 'pm2 logs' for build-time memory issues."
fi
log "Build successful."

# ─── 4. Database Angle (Safety First) ──────────────────────────────────────
info "Synchronizing database schema..."

# Load environment variables for Prisma - Absolute Path & Force Export
DOTENV_PATH="$APP_DIR/apps/backend/.env"
if [[ -f "$DOTENV_PATH" ]]; then
    # Handle both source and manual export just to be doubly sure
    set -a
    source "$DOTENV_PATH"
    set +a
    
    # Manual backup export for Prisma
    DB_URL_VAL=$(grep '^DATABASE_URL=' "$DOTENV_PATH" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    export DATABASE_URL="$DB_URL_VAL"
    
    log "Environment variables exported."
else
    warn "Backend .env NOT FOUND at $DOTENV_PATH"
fi

PRISMA_SCHEMA=$(find . -name "schema.prisma" -not -path "*/node_modules/*" -not -path "*/dist/*" | head -1)
if [[ -n "$PRISMA_SCHEMA" ]]; then
    info "Running migrations using schema: $PRISMA_SCHEMA"
    # generate client again to be safe
    npx prisma generate --schema="$PRISMA_SCHEMA"
    # apply migrations
    npx prisma migrate deploy --schema="$PRISMA_SCHEMA"
    log "Database schema is up-to-date."
else
    warn "No schema.prisma found, skipping migrations."
fi

# ─── 5. UI/Frontend Angle (Asset Stabilization) ──────────────────────────
info "Stabilizing Next.js standalone assets..."
FE_STANDALONE="apps/user-app/.next/standalone"
if [[ -d "$FE_STANDALONE" ]]; then
    # Next.js standalone requires public & static folders to be copied for runtime
    cp -r apps/user-app/public "$FE_STANDALONE/apps/user-app/public" 2>/dev/null || true
    mkdir -p "$FE_STANDALONE/apps/user-app/.next/static"
    cp -r apps/user-app/.next/static "$FE_STANDALONE/apps/user-app/.next/" 2>/dev/null || true
    log "Standalone artifacts stabilized."
fi

# ─── 6. Zero-Downtime Reload ──────────────────────────────────────────────
info "Reloading PM2 services..."

pm2 reload deployment/conf/ecosystem.config.js --update-env
pm2 save
log "Services reloaded (Zero-Downtime)."

# ─── 7. Final Health Angle (Deep Check) ──────────────────────────────────
info "Running post-deploy health check..."
sleep 5 # wait for startup

CHECK_BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/v1/health 2>/dev/null || echo "000")
CHECK_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login 2>/dev/null || echo "000")

if [[ "$CHECK_BACKEND" == "200" ]] && [[ "$CHECK_FRONTEND" == "200" ]]; then
    log "SUCCESS: Deep health check passed."
else
    warn "WARNING: Health checks returned Backend:$CHECK_BACKEND, Frontend:$CHECK_FRONTEND"
    warn "Please check pm2 logs manually."
fi

echo ""
pm2 status
echo ""
info "═══ Deployment Complete: $(date) ═══"
info "Log saved to: $LOG_FILE"
