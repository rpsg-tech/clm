#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 10: Backup Setup
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
BACKUP_DIR="/opt/clm/backups/postgres"

# ─── 1. Create Backup Directory ─────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
chown clmadmin:clmadmin "$BACKUP_DIR"
log "Backup directory: $BACKUP_DIR"

# ─── 2. Deploy Backup Script ────────────────────────────────────────────────
info "Deploying PostgreSQL backup script..."

cp "$SCRIPT_DIR/scripts/pg-backup.sh" /opt/clm/scripts/pg-backup.sh
chmod +x /opt/clm/scripts/pg-backup.sh
chown clmadmin:clmadmin /opt/clm/scripts/pg-backup.sh

log "Backup script deployed to /opt/clm/scripts/pg-backup.sh"

# ─── 3. Setup Cron Job ──────────────────────────────────────────────────────
info "Setting up daily backup cron job..."

# Install cron for postgres user (runs pg_dump)
CRON_LINE="0 2 * * * /opt/clm/scripts/pg-backup.sh >> /opt/clm/logs/backup.log 2>&1"

# Remove existing CLM backup cron entries
crontab -u postgres -l 2>/dev/null | grep -v "pg-backup.sh" | crontab -u postgres - 2>/dev/null || true

# Add new cron entry
(crontab -u postgres -l 2>/dev/null || true; echo "$CRON_LINE") | crontab -u postgres -

log "Daily backup cron installed (02:00 AM daily)"

# ─── 4. Run Initial Backup ──────────────────────────────────────────────────
info "Running initial backup..."
sudo -u postgres /opt/clm/scripts/pg-backup.sh

if [[ $? -eq 0 ]]; then
    LATEST=$(ls -t "$BACKUP_DIR"/*.gz 2>/dev/null | head -1)
    if [[ -n "$LATEST" ]]; then
        SIZE=$(du -h "$LATEST" | awk '{print $1}')
        log "Initial backup complete: $LATEST ($SIZE)"
    fi
else
    warn "Initial backup may have failed. Check /opt/clm/logs/backup.log"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 10: Backup Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Schedule:   Daily at 02:00 AM"
echo "  Retention:  30 days"
echo "  Location:   $BACKUP_DIR"
echo "  Script:     /opt/clm/scripts/pg-backup.sh"
echo "  Log:        /opt/clm/logs/backup.log"
echo ""
echo "  Next: bash 11-monitoring-setup.sh"
