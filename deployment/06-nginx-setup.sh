#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 6: Nginx Setup
# Target: RHEL 9.x | Run as: root
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

[[ $EUID -ne 0 ]] && err "This script must be run as root"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── 1. Install Nginx ───────────────────────────────────────────────────────
info "Installing Nginx..."
dnf install -y nginx
log "Nginx installed: $(nginx -v 2>&1 | awk -F/ '{print $2}')"

# ─── 2. Create Certbot Directory ────────────────────────────────────────────
mkdir -p /var/www/certbot

# ─── 3. Remove Default Config ───────────────────────────────────────────────
info "Cleaning default Nginx configuration..."
# Comment out the default server block in nginx.conf
if [[ -f /etc/nginx/nginx.conf ]]; then
    # Backup original
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak

    # Remove default server block from nginx.conf (the one inside http{})
    # Instead we load from conf.d/ only
    sed -i '/^[[:space:]]*server {/,/^[[:space:]]*}/d' /etc/nginx/nginx.conf 2>/dev/null || true
fi

# Remove default.conf if it exists
rm -f /etc/nginx/conf.d/default.conf

log "Default config cleaned"

# ─── 4. Deploy CLM Nginx Config ─────────────────────────────────────────────
info "Deploying CLM Nginx configuration..."

if [[ -f "$SCRIPT_DIR/conf/nginx-clm.conf" ]]; then
    cp "$SCRIPT_DIR/conf/nginx-clm.conf" /etc/nginx/conf.d/clm.conf
    log "Config deployed to /etc/nginx/conf.d/clm.conf"
else
    err "nginx-clm.conf not found in $SCRIPT_DIR/conf/"
fi

# ─── 5. Create Initial Self-Signed Cert (so Nginx can start before Certbot) ─
info "Creating temporary self-signed certificate..."

CERT_DIR="/etc/letsencrypt/live/clm.rpsg.in"
if [[ ! -f "$CERT_DIR/fullchain.pem" ]]; then
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 1 \
        -newkey rsa:2048 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/CN=clm.rpsg.in/O=CLM Enterprise/C=IN" 2>/dev/null

    # Create chain.pem (same as fullchain for self-signed)
    cp "$CERT_DIR/fullchain.pem" "$CERT_DIR/chain.pem"

    log "Temporary self-signed cert created (will be replaced by Certbot)"
else
    warn "Certificate already exists, skipping self-signed generation"
fi

# ─── 6. Optimize Nginx Main Config ──────────────────────────────────────────
info "Applying Nginx performance settings..."

# Check if our worker settings are already applied
if ! grep -q "worker_rlimit_nofile" /etc/nginx/nginx.conf; then
    # Add performance directives at the top of nginx.conf
    sed -i '1i\
worker_rlimit_nofile 65535;' /etc/nginx/nginx.conf
fi

# Ensure worker_processes is set to auto
sed -i 's/^worker_processes.*/worker_processes auto;/' /etc/nginx/nginx.conf

# Add/update worker_connections
sed -i 's/worker_connections.*/worker_connections 4096;/' /etc/nginx/nginx.conf

log "Nginx performance settings applied"

# ─── 7. Test Configuration ──────────────────────────────────────────────────
info "Testing Nginx configuration..."
if nginx -t 2>&1; then
    log "Nginx configuration test passed"
else
    err "Nginx configuration test FAILED. Fix errors above."
fi

# ─── 8. Start Nginx ─────────────────────────────────────────────────────────
info "Starting Nginx..."
systemctl enable --now nginx

if systemctl is-active --quiet nginx; then
    log "Nginx is running"
else
    err "Nginx failed to start. Check: journalctl -u nginx"
fi

# ─── 9. Verify ──────────────────────────────────────────────────────────────
echo ""
echo "  Nginx:   $(nginx -v 2>&1 | awk -F/ '{print $2}')"
echo "  Config:  /etc/nginx/conf.d/clm.conf"
echo "  Logs:    /var/log/nginx/clm-access.log"
echo "           /var/log/nginx/clm-error.log"
echo ""
echo "  Routes:"
echo "    /api/v1/*  →  127.0.0.1:3001 (NestJS backend)"
echo "    /*         →  127.0.0.1:3000 (Next.js frontend)"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 6: Nginx Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}NOTE: Using temporary self-signed cert. Run 09-ssl-setup.sh for Let's Encrypt.${NC}"
echo ""
echo "  Next: bash 07-app-deploy.sh (as clmadmin)"
