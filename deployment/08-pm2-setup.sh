#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 8: PM2 Setup & Autostart
# Target: RHEL 9.x | Run as: clmadmin
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ECOSYSTEM="$SCRIPT_DIR/conf/ecosystem.config.js"

if [[ ! -f "$ECOSYSTEM" ]]; then
    err "ecosystem.config.js not found at $ECOSYSTEM"
fi

# ─── 1. Verify .env Exists ──────────────────────────────────────────────────
if [[ ! -f "/opt/clm/app/apps/backend/.env" ]]; then
    err "Backend .env not found! Run 07-app-deploy.sh first and configure .env"
fi

# Check for placeholder values
if grep -q "<FILL_IN>\|<GENERATE>" /opt/clm/app/apps/backend/.env; then
    warn "Your .env still contains placeholder values (<FILL_IN> or <GENERATE>)!"
    warn "Services may fail to start until these are filled in."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ─── 2. Copy Ecosystem Config ───────────────────────────────────────────────
info "Deploying PM2 ecosystem config..."
cp "$ECOSYSTEM" /opt/clm/app/ecosystem.config.js
log "Ecosystem config copied to /opt/clm/app/"

# ─── 3. Stop Existing PM2 Processes ─────────────────────────────────────────
info "Stopping any existing PM2 processes..."
pm2 delete all 2>/dev/null || true

# ─── 4. Start Applications ──────────────────────────────────────────────────
info "Starting CLM applications with PM2..."
cd /opt/clm/app
pm2 start ecosystem.config.js

# Wait for processes to stabilize
sleep 5

# ─── 5. Verify Processes ────────────────────────────────────────────────────
info "Verifying PM2 processes..."

BACKEND_ONLINE=$(pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-backend" and .pm2_env.status=="online")] | length' 2>/dev/null || echo "0")
FRONTEND_ONLINE=$(pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-frontend" and .pm2_env.status=="online")] | length' 2>/dev/null || echo "0")

echo ""
echo "  Backend instances:  $BACKEND_ONLINE online"
echo "  Frontend instances: $FRONTEND_ONLINE online"

if [[ "$BACKEND_ONLINE" -eq 0 ]]; then
    warn "No backend instances are online! Check logs:"
    echo "  pm2 logs clm-backend --lines 50"
fi

if [[ "$FRONTEND_ONLINE" -eq 0 ]]; then
    warn "No frontend instances are online! Check logs:"
    echo "  pm2 logs clm-frontend --lines 50"
fi

# Show status table
pm2 status

# ─── 6. Setup Autostart on Reboot ───────────────────────────────────────────
info "Configuring PM2 autostart on reboot..."

# Generate startup script (this needs sudo)
STARTUP_CMD=$(pm2 startup systemd -u clmadmin --hp /home/clmadmin 2>&1 | grep "sudo" | head -1)

if [[ -n "$STARTUP_CMD" ]]; then
    echo ""
    warn "Run the following command as ROOT to enable autostart:"
    echo ""
    echo -e "  ${CYAN}${STARTUP_CMD}${NC}"
    echo ""
    
    # Try to run it if we have sudo access
    if sudo -n true 2>/dev/null; then
        eval "$STARTUP_CMD"
        log "PM2 startup configured automatically (sudo available)"
    else
        warn "Could not run automatically. Please run the above command as root."
    fi
fi

# Save current process list
pm2 save
log "PM2 process list saved"

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 8: PM2 Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Useful commands:"
echo "    pm2 status             — check process status"
echo "    pm2 logs               — view all logs"
echo "    pm2 logs clm-backend   — backend logs only"
echo "    pm2 reload all         — zero-downtime restart"
echo "    pm2 monit              — real-time monitoring"
echo ""
echo "  Next: bash 09-ssl-setup.sh (as root)"
