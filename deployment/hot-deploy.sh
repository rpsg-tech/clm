#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Hot-Deploy Script (Zero-Downtime)
# Target: RHEL 9.x | Run as: clmadmin
#
# This script performs a fast, safe deployment of the latest code from main.
# It includes: dependency check, build, migration, and PM2 reload.
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

APP_DIR="/opt/clm/app"
BRANCH="main"

cd "$APP_DIR"

info "═══ CLM Enterprise: Hot-Deploy Started ═══"

# 1. Pull Latest Code
info "Pulling latest code from $BRANCH..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
log "Code synchronized with origin/$BRANCH"

# 2. Install Dependencies
info "Checking dependencies..."
export PUPPETEER_SKIP_DOWNLOAD=true
export NEXT_TELEMETRY_DISABLED=1
npm ci --include=dev
log "Dependencies verified"

# 3. Build Monorepo
info "Building applications (Turbo)..."
npm run db:generate
npx turbo run build

# 4. Prepare Next.js Standalone (Critical)
info "Stabilizing standalone artifacts..."
STANDALONE_DIR="apps/user-app/.next/standalone"
if [[ -d "$STANDALONE_DIR" ]]; then
    # Ensure static and public folders are correctly mapped for Nginx
    cp -r apps/user-app/public "$STANDALONE_DIR/apps/user-app/public" 2>/dev/null || true
    mkdir -p "$STANDALONE_DIR/apps/user-app/.next/static"
    cp -r apps/user-app/.next/static "$STANDALONE_DIR/apps/user-app/.next/" 2>/dev/null || true
    log "Frontend standalone artifacts ready"
fi

# 5. Database Migrations
info "Applying database migrations..."
PRISMA_SCHEMA=$(find . -name "schema.prisma" -not -path "*/node_modules/*" -not -path "*/dist/*" | head -1)
if [[ -n "$PRISMA_SCHEMA" ]]; then
    npx prisma migrate deploy --schema="$PRISMA_SCHEMA"
    log "Database schema updated"
fi

# 6. Zero-Downtime Reload
info "Performing zero-downtime PM2 reload..."
# Use reload instead of restart to keep at least 1 instance alive at all times
pm2 reload deployment/conf/ecosystem.config.js --update-env
pm2 save
log "Services reloaded successfully"

# 7. Final Status
echo ""
pm2 status
echo ""
info "═══ Hot-Deploy Complete: $(date) ═══"
