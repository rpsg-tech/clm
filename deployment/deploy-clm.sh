#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Master Deployment Orchestrator
# Target: RHEL 9.x | Run as: root
#
# This script runs all deployment phases in order.
# Each phase is idempotent — safe to re-run.
#
# Usage:
#   bash deploy-clm.sh           # Full deployment
#   bash deploy-clm.sh --skip-ssl # Skip SSL (if DNS not ready)
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="/opt/clm/logs"
LOG_FILE="$LOG_DIR/deployment-$(date +%Y%m%d_%H%M%S).log"
SKIP_SSL=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-ssl) SKIP_SSL=true ;;
    esac
done

[[ $EUID -ne 0 ]] && { echo -e "${RED}This script must be run as root${NC}"; exit 1; }

# ── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}║   CLM Enterprise — Production Deployment                      ║${NC}"
echo -e "${CYAN}║   Server: CLM-Prod (RHEL 9.x)                                ║${NC}"
echo -e "${CYAN}║   Date: $(date '+%Y-%m-%d %H:%M:%S')                                  ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Pre-flight Checks ───────────────────────────────────────────────────────
echo -e "${CYAN}Pre-flight checks...${NC}"

# Check OS
if [[ -f /etc/redhat-release ]]; then
    echo -e "  ${GREEN}✅${NC} OS: $(cat /etc/redhat-release)"
else
    echo -e "  ${RED}❌${NC} Not RHEL/CentOS — aborting"; exit 1
fi

# Check RAM
TOTAL_RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
echo -e "  ${GREEN}✅${NC} RAM: ${TOTAL_RAM_GB} GB"

# Check disk
for mount in / /var /opt /mnt/data; do
    if df -h "$mount" &>/dev/null; then
        SIZE=$(df -h "$mount" | tail -1 | awk '{print $2}')
        echo -e "  ${GREEN}✅${NC} $mount: $SIZE"
    else
        echo -e "  ${YELLOW}⚠️${NC}  $mount: not mounted"
    fi
done

echo ""
echo -e "${YELLOW}Starting deployment in 5 seconds... Press Ctrl+C to abort.${NC}"
sleep 5

# ── Ensure log directory exists ──────────────────────────────────────────────
mkdir -p "$LOG_DIR"

# ── Phase Execution ─────────────────────────────────────────────────────────
run_phase() {
    local script="$1"
    local name="$2"
    local run_as="${3:-root}"
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Starting: $name${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [[ ! -f "$SCRIPT_DIR/$script" ]]; then
        echo -e "${RED}  Script not found: $script${NC}"
        return 1
    fi
    
    chmod +x "$SCRIPT_DIR/$script"
    
    if [[ "$run_as" == "clmadmin" ]]; then
        sudo -u clmadmin bash "$SCRIPT_DIR/$script" 2>&1 | tee -a "$LOG_FILE"
    else
        bash "$SCRIPT_DIR/$script" 2>&1 | tee -a "$LOG_FILE"
    fi
    
    local status=$?
    if [[ $status -eq 0 ]]; then
        echo -e "${GREEN}  ✅ $name — COMPLETE${NC}" | tee -a "$LOG_FILE"
    else
        echo -e "${RED}  ❌ $name — FAILED (exit code: $status)${NC}" | tee -a "$LOG_FILE"
        echo -e "${RED}  Check log: $LOG_FILE${NC}"
        echo ""
        read -p "Continue with next phase? (y/N) " -n 1 -r
        echo
        [[ $REPLY =~ ^[Yy]$ ]] || exit 1
    fi
}

# ── Run All Phases ──────────────────────────────────────────────────────────

# Make all scripts executable
chmod +x "$SCRIPT_DIR"/*.sh "$SCRIPT_DIR"/scripts/*.sh 2>/dev/null || true

# Phase 1-4: Infrastructure (as root)
run_phase "01-server-prep.sh"       "Phase 1: Server Preparation"
run_phase "02-nodejs-install.sh"    "Phase 2: Node.js Installation"
run_phase "03-postgresql-setup.sh"  "Phase 3: PostgreSQL Setup"
run_phase "04-redis-setup.sh"       "Phase 4: Redis Setup"

# Phase 5: MinIO — SKIPPED (TODO)
echo ""
echo -e "${YELLOW}  ⏭  Phase 5: MinIO — SKIPPED (using S3, run 05-minio-setup.sh later)${NC}"

# Phase 6: Nginx (as root)
run_phase "06-nginx-setup.sh"       "Phase 6: Nginx Setup"

# Phase 7: Application (as clmadmin)
run_phase "07-app-deploy.sh"        "Phase 7: Application Deployment" "clmadmin"

# Pause for .env review
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  PAUSING: Please review /opt/clm/app/apps/backend/.env${NC}"
echo -e "${YELLOW}  Fill in any remaining <FILL_IN> values (S3, SMTP, etc.)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
read -p "Press Enter when .env is ready, or Ctrl+C to abort... "

# Phase 8: PM2 (as clmadmin)
run_phase "08-pm2-setup.sh"         "Phase 8: PM2 Setup" "clmadmin"

# Phase 9: SSL (as root, optional)
if [[ "$SKIP_SSL" == true ]]; then
    echo -e "${YELLOW}  ⏭  Phase 9: SSL — SKIPPED (--skip-ssl flag)${NC}"
else
    run_phase "09-ssl-setup.sh"     "Phase 9: SSL Certificate"
fi

# Phase 10-11: Backup & Monitoring (as root)
run_phase "10-backup-setup.sh"      "Phase 10: Backup Setup"
run_phase "11-monitoring-setup.sh"  "Phase 11: Monitoring Setup"

# Phase 12: Validation
run_phase "12-validate.sh"          "Phase 12: Final Validation"

# ── Final Summary ────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║   🎉 CLM Enterprise — Deployment Complete!                    ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║   Application: https://clm.rpsg.in                            ║${NC}"
echo -e "${GREEN}║   API:         https://clm.rpsg.in/api/v1                     ║${NC}"
echo -e "${GREEN}║   Log:         $LOG_FILE  ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Useful commands:"
echo "    sudo -u clmadmin pm2 status       — process status"
echo "    sudo -u clmadmin pm2 logs         — application logs"
echo "    sudo -u clmadmin pm2 monit        — live monitoring"
echo "    sudo -u clmadmin pm2 reload all   — zero-downtime restart"
echo "    bash /opt/clm/scripts/health-check.sh  — health check"
echo ""
