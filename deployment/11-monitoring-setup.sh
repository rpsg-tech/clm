#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 11: Monitoring Setup
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

# ─── 1. Nginx Log Rotation ──────────────────────────────────────────────────
info "Configuring Nginx log rotation..."

cat > /etc/logrotate.d/clm-nginx << 'LOGROTATE'
/var/log/nginx/clm-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 nginx adm
    sharedscripts
    postrotate
        /bin/kill -USR1 $(cat /var/run/nginx.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
LOGROTATE

log "Nginx log rotation configured (30 days, compressed)"

# ─── 2. Application Log Rotation ────────────────────────────────────────────
info "Configuring application log rotation..."

cat > /etc/logrotate.d/clm-app << 'LOGROTATE'
/opt/clm/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 clmadmin clmadmin
    copytruncate
}
LOGROTATE

log "Application log rotation configured (30 days)"

# ─── 3. Disk Space Monitoring ───────────────────────────────────────────────
info "Setting up disk space monitoring..."

cat > /opt/clm/scripts/disk-monitor.sh << 'DISKMON'
#!/usr/bin/env bash
# Check disk usage and warn if any mount exceeds threshold
THRESHOLD=85
ALERT_LOG="/opt/clm/logs/disk-alerts.log"

while IFS= read -r line; do
    USAGE=$(echo "$line" | awk '{print $5}' | tr -d '%')
    MOUNT=$(echo "$line" | awk '{print $6}')
    
    if [[ "$USAGE" -ge "$THRESHOLD" ]]; then
        MSG="$(date '+%Y-%m-%d %H:%M:%S') — DISK WARNING: $MOUNT is at ${USAGE}%"
        echo "$MSG" >> "$ALERT_LOG"
        echo "$MSG" >&2
        
        # Could add email/webhook alert here
        # curl -s -X POST "https://hooks.slack.com/..." -d "{\"text\": \"$MSG\"}" 2>/dev/null || true
    fi
done < <(df -h / /var /opt /mnt/data 2>/dev/null | tail -n +2)
DISKMON

chmod +x /opt/clm/scripts/disk-monitor.sh
chown clmadmin:clmadmin /opt/clm/scripts/disk-monitor.sh

# Schedule disk monitoring every 15 minutes
DISK_CRON="*/15 * * * * /opt/clm/scripts/disk-monitor.sh 2>&1"
(crontab -u clmadmin -l 2>/dev/null | grep -v "disk-monitor.sh" || true; echo "$DISK_CRON") | crontab -u clmadmin -

log "Disk monitoring cron installed (every 15 min, threshold: 85%)"

# ─── 4. Deploy Health Check Script ──────────────────────────────────────────
info "Deploying health check script..."

cp "$SCRIPT_DIR/scripts/health-check.sh" /opt/clm/scripts/health-check.sh
chmod +x /opt/clm/scripts/health-check.sh
chown clmadmin:clmadmin /opt/clm/scripts/health-check.sh

log "Health check script: /opt/clm/scripts/health-check.sh"

# ─── 5. System Journal Persistence ──────────────────────────────────────────
info "Configuring journal persistence..."

mkdir -p /var/log/journal
systemd-tmpfiles --create --prefix /var/log/journal 2>/dev/null || true

# Limit journal size
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/clm.conf << 'JOURNAL'
[Journal]
SystemMaxUse=2G
SystemKeepFree=1G
MaxRetentionSec=30day
JOURNAL

systemctl restart systemd-journald
log "Journal persistence configured (2GB max, 30 days)"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 11: Monitoring Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Log rotation:   /etc/logrotate.d/clm-nginx, clm-app"
echo "  Disk monitor:   Every 15 min (threshold 85%)"
echo "  Health check:   /opt/clm/scripts/health-check.sh"
echo "  Journal:        2GB max, 30 days retention"
echo ""
echo "  Next: bash 12-validate.sh"
