#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 1: Server Preparation
# Target: RHEL 9.x | Run as: root
# ==============================================================================
set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

# ─── Pre-flight ──────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && err "This script must be run as root"
[[ -f /etc/redhat-release ]] || err "This script is designed for RHEL/CentOS"

info "Starting server preparation..."

# ─── 1. System Update ────────────────────────────────────────────────────────
info "Updating system packages..."
dnf update -y --quiet
# EPEL is required for Redis 7, certbot, and other tools
dnf install -y --quiet epel-release 2>/dev/null || \
    dnf install -y --quiet https://dl.fedoraproject.org/pub/epel/epel-release-latest-9.noarch.rpm 2>/dev/null || true

# CRB (CodeReady Linux Builder) is required by some EPEL packages (certbot deps)
/usr/bin/crb enable 2>/dev/null || dnf config-manager --set-enabled crb 2>/dev/null || true

dnf install -y --quiet \
    git curl wget tar unzip bzip2 \
    gcc gcc-c++ make cmake \
    openssl openssl-devel \
    zlib zlib-devel \
    readline-devel \
    rsync \
    policycoreutils-python-utils \
    setools-console \
    firewalld \
    logrotate \
    cronie cronie-anacron \
    jq \
    htop \
    net-tools bind-utils \
    lsof
log "System packages updated and base tools installed"

# ─── 2. Enable Essential Services ────────────────────────────────────────────
systemctl enable --now firewalld
systemctl enable --now crond
log "firewalld and crond enabled"

# ─── 3. Create Deploy User ──────────────────────────────────────────────────
USERNAME="clmadmin"
if id "$USERNAME" &>/dev/null; then
    warn "User $USERNAME already exists, skipping"
else
    useradd -m -s /bin/bash -c "CLM Deploy User" "$USERNAME"
    # Add to wheel group for limited sudo (optional — remove if policy forbids)
    # usermod -aG wheel "$USERNAME"
    log "Created user: $USERNAME"
fi

# ─── 4. Directory Structure ─────────────────────────────────────────────────
info "Creating directory structure..."

# Application directories (on /opt — 100 GB)
mkdir -p /opt/clm/{app,logs,backups,ssl,scripts}

# Data directories (on /mnt/data — ~600 GB)
mkdir -p /mnt/data/{postgres,minio,redis,backups/postgres}

# Set ownership
chown -R "$USERNAME":"$USERNAME" /opt/clm
chown -R "$USERNAME":"$USERNAME" /mnt/data/backups

log "Directory structure created:"
echo "    /opt/clm/app          ← application code"
echo "    /opt/clm/logs         ← PM2 & app logs"
echo "    /opt/clm/backups      ← backup scripts"
echo "    /opt/clm/ssl          ← SSL certs"
echo "    /mnt/data/postgres    ← PostgreSQL data"
echo "    /mnt/data/minio       ← MinIO data (future)"
echo "    /mnt/data/redis       ← Redis persistence"
echo "    /mnt/data/backups     ← backup storage"

# ─── 5. Firewall Configuration ──────────────────────────────────────────────
info "Configuring firewall..."

# Allow HTTP and HTTPS only
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https

# Explicitly block service ports from external access (they're already blocked
# by default in the public zone, but this makes policy explicit)
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" port port="5432" protocol="tcp" reject'
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" port port="6379" protocol="tcp" reject'
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" port port="9000" protocol="tcp" reject'
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" port port="9001" protocol="tcp" reject'

# Reload firewall
firewall-cmd --reload
log "Firewall configured: 80/443 open, 5432/6379/9000/9001 blocked"

# ─── 6. System Tuning (sysctl) ──────────────────────────────────────────────
info "Applying kernel tuning..."

cat > /etc/sysctl.d/99-clm-production.conf << 'SYSCTL'
# ── CLM Production Kernel Tuning ──

# File descriptors
fs.file-max = 2097152
fs.nr_open = 2097152

# Network performance
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_keepalive_time = 60
net.ipv4.tcp_keepalive_intvl = 10
net.ipv4.tcp_keepalive_probes = 6
net.ipv4.ip_local_port_range = 1024 65535

# Memory (required by Redis)
vm.overcommit_memory = 1
vm.swappiness = 10

# Shared memory for PostgreSQL
kernel.shmmax = 17179869184
kernel.shmall = 4194304
SYSCTL

sysctl --system --quiet
log "Kernel tuning applied"

# ─── 7. Disable Transparent Huge Pages (Redis requirement) ───────────────────
info "Disabling Transparent Huge Pages..."

cat > /etc/systemd/system/disable-thp.service << 'THP'
[Unit]
Description=Disable Transparent Huge Pages (THP)
DefaultDependencies=no
After=sysinit.target local-fs.target
Before=basic.target

[Service]
Type=oneshot
ExecStart=/bin/sh -c 'echo never > /sys/kernel/mm/transparent_hugepage/enabled && echo never > /sys/kernel/mm/transparent_hugepage/defrag'

[Install]
WantedBy=basic.target
THP

systemctl daemon-reload
systemctl enable --now disable-thp.service 2>/dev/null || true
log "Transparent Huge Pages disabled"

# ─── 8. Ulimit Configuration ────────────────────────────────────────────────
info "Setting ulimits for $USERNAME..."

cat > /etc/security/limits.d/99-clm.conf << LIMITS
# CLM Production Limits
$USERNAME    soft    nofile    65536
$USERNAME    hard    nofile    65536
$USERNAME    soft    nproc     65536
$USERNAME    hard    nproc     65536
root         soft    nofile    65536
root         hard    nofile    65536
LIMITS

log "Ulimits configured (nofile: 65536, nproc: 65536)"

# ─── 9. SELinux Configuration ────────────────────────────────────────────────
info "Configuring SELinux policies..."

# Allow Nginx to make network connections (proxy_pass)
setsebool -P httpd_can_network_connect 1

# Allow Nginx to connect to upstream ports
setsebool -P httpd_can_network_relay 1

log "SELinux booleans set for Nginx reverse proxy"

# ─── 10. Set Timezone ────────────────────────────────────────────────────────
timedatectl set-timezone Asia/Kolkata
log "Timezone set to Asia/Kolkata"

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 1: Server Preparation — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Next: bash 02-nodejs-install.sh"
