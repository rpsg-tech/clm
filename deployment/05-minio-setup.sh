#!/usr/bin/env bash
# ==============================================================================
# ==============================================================================
# CLM Enterprise — Phase 5: MinIO Setup
# Target: RHEL 9.x | Run as: root
#
# After running this script, you also need to:
#   1. Update .env with MinIO credentials generated in /opt/clm/.minio-credentials
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

[[ $EUID -ne 0 ]] && err "This script must be run as root"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MINIO_DATA="/mnt/data/minio"
MINIO_USER="minio-user"
MINIO_ROOT_USER="clm-minio-admin"
MINIO_ROOT_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

# Starting MinIO Setup...

# ─── 1. Create MinIO System User ────────────────────────────────────────────
info "Creating MinIO system user..."
if id "$MINIO_USER" &>/dev/null; then
    warn "User $MINIO_USER already exists"
else
    useradd -r -s /sbin/nologin -d /dev/null -c "MinIO Service Account" "$MINIO_USER"
    log "Created system user: $MINIO_USER"
fi

# ─── 2. Download MinIO Server Binary ────────────────────────────────────────
info "Downloading MinIO server..."
curl -L --progress-bar https://dl.min.io/server/minio/release/linux-amd64/minio -o /tmp/minio
chmod +x /tmp/minio
mv /tmp/minio /usr/local/bin/minio
log "MinIO binary installed: $(/usr/local/bin/minio --version | head -1)"

# ─── 3. Download MinIO Client (mc) ──────────────────────────────────────────
info "Downloading MinIO Client (mc)..."
curl -L --progress-bar https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc
chmod +x /tmp/mc
mv /tmp/mc /usr/local/bin/mc
log "MinIO Client installed"

# ─── 4. Create Data Directory ───────────────────────────────────────────────
info "Setting up MinIO data directory..."
mkdir -p "$MINIO_DATA"
chown -R "$MINIO_USER":"$MINIO_USER" "$MINIO_DATA"
chmod 750 "$MINIO_DATA"
log "Data directory: $MINIO_DATA"

# ─── 5. Create Environment File ─────────────────────────────────────────────
info "Creating MinIO environment file..."
cat > /etc/default/minio << EOF
# MinIO Environment Configuration
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASS}
MINIO_VOLUMES=${MINIO_DATA}
MINIO_OPTS="--console-address :9001"
EOF
chmod 600 /etc/default/minio
log "Environment file: /etc/default/minio"

# ─── 6. Install Systemd Service ─────────────────────────────────────────────
info "Installing systemd service..."
if [[ -f "$SCRIPT_DIR/conf/minio.service" ]]; then
    cp "$SCRIPT_DIR/conf/minio.service" /etc/systemd/system/minio.service
else
    cat > /etc/systemd/system/minio.service << 'SVCFILE'
[Unit]
Description=MinIO Object Storage
Documentation=https://min.io/docs
After=network-online.target
Wants=network-online.target

[Service]
User=minio-user
Group=minio-user
Type=notify
EnvironmentFile=/etc/default/minio
ExecStart=/usr/local/bin/minio server $MINIO_VOLUMES $MINIO_OPTS
Restart=always
RestartSec=5
LimitNOFILE=65536
TasksMax=infinity
TimeoutStartSec=0
TimeoutStopSec=120

[Install]
WantedBy=multi-user.target
SVCFILE
fi

systemctl daemon-reload
log "Systemd service installed"

# ─── 7. SELinux for MinIO ───────────────────────────────────────────────────
info "Setting SELinux context..."
semanage fcontext -a -t var_lib_t "$MINIO_DATA(/.*)?" 2>/dev/null || true
restorecon -Rv "$MINIO_DATA" 2>/dev/null || true

# ─── 8. Start MinIO ─────────────────────────────────────────────────────────
info "Starting MinIO..."
systemctl enable --now minio

sleep 3

if systemctl is-active --quiet minio; then
    log "MinIO is running"
else
    err "MinIO failed to start. Check: journalctl -u minio"
fi

# ─── 9. Create Default Bucket ───────────────────────────────────────────────
info "Creating default bucket 'clm-documents'..."
mc alias set clm-local http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASS" 2>/dev/null
mc mb --ignore-existing clm-local/clm-documents 2>/dev/null
log "Bucket 'clm-documents' created"

# ─── 10. Save Credentials ───────────────────────────────────────────────────
CRED_FILE="/opt/clm/.minio-credentials"
cat > "$CRED_FILE" << EOF
# MinIO Credentials (generated $(date +%Y-%m-%d))
# KEEP THIS FILE SECURE — delete after adding to .env
MINIO_ROOT_USER=${MINIO_ROOT_USER}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASS}
MINIO_API_ENDPOINT=http://127.0.0.1:9000
MINIO_CONSOLE_URL=http://127.0.0.1:9001
MINIO_BUCKET=clm-documents

# For .env file (S3 compatible):
AWS_ACCESS_KEY_ID=${MINIO_ROOT_USER}
AWS_SECRET_ACCESS_KEY=${MINIO_ROOT_PASS}
AWS_REGION=us-east-1
S3_BUCKET_NAME=clm-documents
S3_ENDPOINT=http://127.0.0.1:9000
S3_FORCE_PATH_STYLE=true
EOF
chown clmadmin:clmadmin "$CRED_FILE"
chmod 600 "$CRED_FILE"

log "Credentials saved to $CRED_FILE"

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "  MinIO API:       http://127.0.0.1:9000"
echo "  MinIO Console:   http://127.0.0.1:9001"
echo "  Default Bucket:  clm-documents"
echo "  Credentials:     $CRED_FILE"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 5: MinIO Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}  REMINDER: To use MinIO, you also need to:${NC}"
echo "  1. Update .env with MinIO credentials from $CRED_FILE"
