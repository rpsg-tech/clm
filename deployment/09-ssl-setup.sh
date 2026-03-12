#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 9: SSL Certificate (Let's Encrypt / Certbot)
# Target: RHEL 9.x | Run as: root
#
# Prerequisites:
#   - DNS for clm.rpsg.in must point to this server's public IP
#   - Port 80 must be open (for HTTP-01 challenge)
#   - Nginx must be running
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

[[ $EUID -ne 0 ]] && err "This script must be run as root"

DOMAIN="clm.rpsg.in"
EMAIL="${CLM_ADMIN_EMAIL:-admin@rpsg.in}"

# ─── 1. Install Certbot ─────────────────────────────────────────────────────
info "Installing Certbot..."

# EPEL and CRB should already be enabled by 01-server-prep.sh, but ensure they are
dnf install -y epel-release 2>/dev/null || dnf install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm 2>/dev/null || true
/usr/bin/crb enable 2>/dev/null || dnf config-manager --set-enabled crb 2>/dev/null || true

dnf install -y certbot python3-certbot-nginx

log "Certbot installed: $(certbot --version 2>&1)"

# ─── 2. Check DNS Resolution ────────────────────────────────────────────────
info "Checking DNS for $DOMAIN..."

RESOLVED_IP=$(dig +short "$DOMAIN" 2>/dev/null | head -1)
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")

if [[ -z "$RESOLVED_IP" ]]; then
    warn "DNS resolution failed for $DOMAIN"
    warn "Make sure the domain points to this server's IP: $SERVER_IP"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
elif [[ "$RESOLVED_IP" != "$SERVER_IP" ]]; then
    warn "DNS mismatch: $DOMAIN → $RESOLVED_IP, but this server is $SERVER_IP"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
else
    log "DNS verified: $DOMAIN → $RESOLVED_IP"
fi

# ─── 3. Obtain Certificate ──────────────────────────────────────────────────
info "Obtaining SSL certificate for $DOMAIN..."

certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect \
    --staple-ocsp

log "SSL certificate obtained for $DOMAIN"

# ─── 4. Verify Certificate ──────────────────────────────────────────────────
info "Verifying certificate..."

CERT_INFO=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -noout -dates 2>/dev/null)
echo "  $CERT_INFO"

# ─── 5. Auto-Renewal ────────────────────────────────────────────────────────
info "Setting up auto-renewal..."

# Enable certbot renewal timer
systemctl enable --now certbot-renew.timer 2>/dev/null || true

# Add post-renewal hook to reload Nginx
mkdir -p /etc/letsencrypt/renewal-hooks/post
cat > /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh << 'HOOK'
#!/bin/bash
systemctl reload nginx
echo "$(date): Nginx reloaded after cert renewal" >> /var/log/certbot-renewal.log
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh

# Test renewal (dry run)
certbot renew --dry-run 2>/dev/null && log "Dry-run renewal test passed" || warn "Dry-run renewal test failed"

log "Auto-renewal configured via systemd timer"

# ─── 6. Test HTTPS ──────────────────────────────────────────────────────────
info "Testing HTTPS..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" 2>/dev/null || echo "000")
if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "301" ]] || [[ "$HTTP_CODE" == "302" ]]; then
    log "HTTPS is working (HTTP $HTTP_CODE)"
else
    warn "HTTPS test returned HTTP $HTTP_CODE (app may not be running yet)"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 9: SSL Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Domain:    https://$DOMAIN"
echo "  Cert:      /etc/letsencrypt/live/$DOMAIN/"
echo "  Auto-renew: certbot-renew.timer (systemd)"
echo ""
echo "  Next: bash 10-backup-setup.sh"
