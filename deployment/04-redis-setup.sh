#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 4: Redis Setup
# Target: RHEL 9.x | Run as: root
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✔]${NC} $*"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $*"; }
err()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }
info() { echo -e "${CYAN}[→]${NC} $*"; }

[[ $EUID -ne 0 ]] && err "This script must be run as root"

REDIS_DATA="/mnt/data/redis"
REDIS_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

# ─── 1. Install Redis 7 ──────────────────────────────────────────────────────
info "Installing Redis 7..."

# RHEL 9 AppStream ships Redis 6.2 by default.
# For Redis 7 (recommended for BullMQ), use the Remi module stream.
dnf install -y https://rpms.remirepo.net/enterprise/remi-release-9.rpm 2>/dev/null || true
dnf module reset -y redis 2>/dev/null || true
dnf module enable -y redis:remi-7.2 2>/dev/null || {
    # Fallback: install from AppStream if Remi fails
    warn "Remi repo unavailable, installing Redis from AppStream (may be 6.x)"
}
dnf install -y redis

log "Redis installed: $(redis-server --version | awk '{print $3}')"

# Determine config path (RHEL 9 uses /etc/redis/redis.conf or /etc/redis.conf)
if [[ -f /etc/redis/redis.conf ]]; then
    REDIS_CONF="/etc/redis/redis.conf"
elif [[ -f /etc/redis.conf ]]; then
    REDIS_CONF="/etc/redis.conf"
else
    REDIS_CONF="/etc/redis/redis.conf"
    mkdir -p /etc/redis
fi

# ─── 2. Configure Redis for Production ──────────────────────────────────────
info "Configuring Redis for production..."

# Backup original config
cp "$REDIS_CONF" "${REDIS_CONF}.bak"

# Create data directory
mkdir -p "$REDIS_DATA"
chown redis:redis "$REDIS_DATA"
chmod 750 "$REDIS_DATA"

# Write production config
# Generate a random suffix for renamed CONFIG command
CONFIG_ALIAS="CLM_CONFIG_$(openssl rand -hex 4)"

cat > "$REDIS_CONF" << REDISCONF
# ═══════════════════════════════════════════════════════════
# CLM Enterprise — Redis Production Configuration
# ═══════════════════════════════════════════════════════════

# ── Network ──
bind 127.0.0.1 -::1
port 6379
protected-mode yes
tcp-backlog 511
timeout 0
tcp-keepalive 300

# ── Security ──
requirepass ${REDIS_PASS}

# ── General ──
daemonize no
supervised systemd
pidfile /var/run/redis/redis.pid
loglevel notice
logfile /var/log/redis/redis.log

# ── Memory ──
maxmemory 4gb
maxmemory-policy allkeys-lru

# ── Persistence (RDB) ──
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ${REDIS_DATA}

# ── Persistence (AOF) ──
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# ── Performance ──
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes

# ── Limits ──
maxclients 10000

# ── Slow Log ──
slowlog-log-slower-than 10000
slowlog-max-len 128

# ── Disable dangerous commands ──
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG "${CONFIG_ALIAS}"
rename-command DEBUG ""
REDISCONF

log "Redis production config written"

# ─── 3. SELinux for Custom Data Dir ─────────────────────────────────────────
info "Setting SELinux context for Redis data..."
semanage fcontext -a -t redis_var_lib_t "$REDIS_DATA(/.*)?" 2>/dev/null || true
restorecon -Rv "$REDIS_DATA" 2>/dev/null || true
log "SELinux context applied for Redis"

# ─── 4. Start Redis ─────────────────────────────────────────────────────────
info "Starting Redis..."
systemctl enable --now redis

sleep 1

# Verify
if redis-cli -a "$REDIS_PASS" --no-auth-warning ping | grep -q PONG; then
    log "Redis is running and responding"
else
    err "Redis failed to start. Check: journalctl -u redis"
fi

# ─── 5. Save Credentials ────────────────────────────────────────────────────
CRED_FILE="/opt/clm/.redis-credentials"
cat > "$CRED_FILE" << EOF
# Redis Credentials (generated $(date +%Y-%m-%d))
# KEEP THIS FILE SECURE — delete after adding to .env
REDIS_PASSWORD=${REDIS_PASS}
REDIS_URL="redis://:${REDIS_PASS}@127.0.0.1:6379"
EOF
chown clmadmin:clmadmin "$CRED_FILE"
chmod 600 "$CRED_FILE"

log "Credentials saved to $CRED_FILE (chmod 600)"

# ─── 6. Verify ──────────────────────────────────────────────────────────────
echo ""
echo "  Redis:      $(redis-server --version | awk '{print $3}')"
echo "  Bind:       127.0.0.1"
echo "  Port:       6379"
echo "  MaxMemory:  4gb"
echo "  Persistence: RDB + AOF"
echo "  Data dir:   $REDIS_DATA"
echo "  Credentials: $CRED_FILE"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 4: Redis Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}IMPORTANT: Copy REDIS_URL from $CRED_FILE into your .env${NC}"
echo ""
echo "  Next: bash 06-nginx-setup.sh (skip 05-minio — it's a TODO)"
