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
# Overwrite nginx.conf with a clean, production-ready version
    # Backup original before overwriting
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak 2>/dev/null || true

    # This removes the default server block and keeps it clean for conf.d/
    cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

# Load dynamic modules
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 4096;
    multi_accept on;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    keepalive_requests  1000;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Performance & Security
    server_tokens       off;
    gzip                on;
    gzip_comp_level     5;
    gzip_min_length     256;
    gzip_proxied        any;
    gzip_types          text/plain application/json application/javascript text/css application/xml application/xml+rss text/javascript;

    # Global Security Headers
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Load modular configuration files from the /etc/nginx/conf.d directory
    include /etc/nginx/conf.d/*.conf;
}
EOF

# Remove default.conf if it exists
rm -f /etc/nginx/conf.d/default.conf

log "Default config cleaned and nginx.conf optimized"

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

# ─── 6. Test Configuration ──────────────────────────────────────────────────
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
