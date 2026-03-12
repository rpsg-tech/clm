#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 2: Node.js Installation
# Target: RHEL 9.x | Run as: root
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

[[ $EUID -ne 0 ]] && err "This script must be run as root"

# ─── 1. Install Node.js 22 LTS ──────────────────────────────────────────────
info "Installing Node.js 22 LTS from NodeSource..."

# Remove any existing NodeSource repo
rm -f /etc/yum.repos.d/nodesource*.repo 2>/dev/null || true

# Install NodeSource repository for Node.js 22.x
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -

# Install Node.js
dnf install -y nodejs

# Verify
NODE_VER=$(node -v)
NPM_VER=$(npm -v)
log "Node.js installed: $NODE_VER"
log "npm installed:     v$NPM_VER"

# ─── 2. npm Production Settings ─────────────────────────────────────────────
info "Configuring npm for production..."

# System-wide npm config
npm config set fund false --global
npm config set audit false --global
npm config set update-notifier false --global
npm config set loglevel warn --global

log "npm production settings applied"

# ─── 3. Install Global Tools ────────────────────────────────────────────────
info "Installing PM2, Turbo, and NestJS CLI globally..."

npm install -g pm2@latest turbo@latest @nestjs/cli@latest ts-node@latest

PM2_VER=$(pm2 -v)
TURBO_VER=$(turbo --version 2>/dev/null || echo "installed")
log "PM2 installed:   v$PM2_VER"
log "Turbo installed: $TURBO_VER"

# ─── 4. PM2 Log Rotation ────────────────────────────────────────────────────
info "Installing PM2 log rotation module..."

pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
pm2 set pm2-logrotate:workerInterval 30
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

log "PM2 log rotation configured (10MB max, 30 files, compressed)"

# ─── 5. Verify Everything ───────────────────────────────────────────────────
echo ""
echo "Verification:"
echo "  node:   $(node -v)"
echo "  npm:    v$(npm -v)"
echo "  pm2:    v$(pm2 -v)"
echo "  turbo:  $(turbo --version 2>/dev/null || echo 'installed')"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 2: Node.js Installation — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Next: bash 03-postgresql-setup.sh"
