#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Health Check Script
# Run manually or via cron for service monitoring
# ==============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

check() {
    local name="$1" status="$2"
    if [[ "$status" == "ok" ]]; then
        echo -e "  ${GREEN}✅${NC} $name"
        ((PASS++))
    elif [[ "$status" == "warn" ]]; then
        echo -e "  ${YELLOW}⚠️${NC}  $name"
        ((WARN++))
    else
        echo -e "  ${RED}❌${NC} $name"
        ((FAIL++))
    fi
}

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  CLM Enterprise — System Health Check"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Systemd Services ─────────────────────────────────────────────────────────
echo "Services:"
for svc in nginx postgresql-16 redis; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        check "$svc — active (running)" "ok"
    else
        check "$svc — INACTIVE" "fail"
    fi
done
echo ""

# ── PostgreSQL ───────────────────────────────────────────────────────────────
echo "PostgreSQL:"
if sudo -u postgres psql -c "SELECT 1;" &>/dev/null; then
    check "Connection — OK" "ok"
else
    check "Connection — FAILED" "fail"
fi

if sudo -u postgres psql -d clm -c "SELECT 1;" &>/dev/null; then
    check "Database 'clm' — accessible" "ok"
else
    check "Database 'clm' — NOT ACCESSIBLE" "fail"
fi

VECTOR=$(sudo -u postgres psql -t -d clm -c "SELECT extname FROM pg_extension WHERE extname='vector';" 2>/dev/null | xargs)
if [[ "$VECTOR" == "vector" ]]; then
    check "pgvector extension — loaded" "ok"
else
    check "pgvector extension — NOT LOADED" "fail"
fi
echo ""

# ── Redis ────────────────────────────────────────────────────────────────────
echo "Redis:"
REDIS_PASS=$(grep -oP 'requirepass \K.*' /etc/redis/redis.conf 2>/dev/null || true)
if [[ -n "$REDIS_PASS" ]]; then
    PONG=$(redis-cli -a "$REDIS_PASS" --no-auth-warning ping 2>/dev/null)
else
    PONG=$(redis-cli ping 2>/dev/null)
fi

if [[ "$PONG" == "PONG" ]]; then
    check "Redis — PONG" "ok"
else
    check "Redis — no response" "fail"
fi
echo ""

# ── PM2 Processes ────────────────────────────────────────────────────────────
echo "PM2 Processes:"
if command -v pm2 &>/dev/null; then
    BACKEND_COUNT=$(sudo -u clmadmin pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-backend" and .pm2_env.status=="online")] | length' 2>/dev/null || echo "0")
    FRONTEND_COUNT=$(sudo -u clmadmin pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-frontend" and .pm2_env.status=="online")] | length' 2>/dev/null || echo "0")
    
    BACKEND_RESTARTS=$(sudo -u clmadmin pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-backend")] | map(.pm2_env.restart_time) | add // 0' 2>/dev/null || echo "?")
    FRONTEND_RESTARTS=$(sudo -u clmadmin pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-frontend")] | map(.pm2_env.restart_time) | add // 0' 2>/dev/null || echo "?")
    
    if [[ "$BACKEND_COUNT" -gt 0 ]]; then
        check "clm-backend — $BACKEND_COUNT instances online ($BACKEND_RESTARTS restarts)" "ok"
    else
        check "clm-backend — offline" "fail"
    fi
    
    if [[ "$FRONTEND_COUNT" -gt 0 ]]; then
        check "clm-frontend — $FRONTEND_COUNT instances online ($FRONTEND_RESTARTS restarts)" "ok"
    else
        check "clm-frontend — offline" "fail"
    fi
else
    check "PM2 — not installed" "fail"
fi
echo ""

# ── HTTP Endpoints ───────────────────────────────────────────────────────────
echo "HTTP Endpoints:"
# Backend health
BACKEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/v1/health 2>/dev/null || echo "000")
if [[ "$BACKEND_HTTP" == "200" ]]; then
    check "Backend /api/v1/health — HTTP $BACKEND_HTTP" "ok"
elif [[ "$BACKEND_HTTP" == "000" ]]; then
    check "Backend /api/v1/health — connection refused" "fail"
else
    check "Backend /api/v1/health — HTTP $BACKEND_HTTP" "warn"
fi

# Frontend
FRONTEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo "000")
if [[ "$FRONTEND_HTTP" == "200" ]]; then
    check "Frontend http://127.0.0.1:3000 — HTTP $FRONTEND_HTTP" "ok"
elif [[ "$FRONTEND_HTTP" == "000" ]]; then
    check "Frontend http://127.0.0.1:3000 — connection refused" "fail"
else
    check "Frontend http://127.0.0.1:3000 — HTTP $FRONTEND_HTTP" "warn"
fi

# Nginx proxy
NGINX_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: clm.rpsg.in" http://127.0.0.1 2>/dev/null || echo "000")
if [[ "$NGINX_HTTP" == "200" ]] || [[ "$NGINX_HTTP" == "301" ]] || [[ "$NGINX_HTTP" == "302" ]]; then
    check "Nginx proxy — HTTP $NGINX_HTTP" "ok"
else
    check "Nginx proxy — HTTP $NGINX_HTTP" "warn"
fi
echo ""

# ── Disk Space ───────────────────────────────────────────────────────────────
echo "Disk Usage:"
while IFS= read -r line; do
    USAGE=$(echo "$line" | awk '{print $5}' | tr -d '%')
    MOUNT=$(echo "$line" | awk '{print $6}')
    AVAIL=$(echo "$line" | awk '{print $4}')
    
    if [[ "$USAGE" -ge 90 ]]; then
        check "$MOUNT — ${USAGE}% (${AVAIL} free)" "fail"
    elif [[ "$USAGE" -ge 80 ]]; then
        check "$MOUNT — ${USAGE}% (${AVAIL} free)" "warn"
    else
        check "$MOUNT — ${USAGE}% (${AVAIL} free)" "ok"
    fi
done < <(df -h / /var /opt /mnt/data 2>/dev/null | tail -n +2)
echo ""

# ── SSL Certificate ─────────────────────────────────────────────────────────
echo "SSL:"
CERT_FILE="/etc/letsencrypt/live/clm.rpsg.in/fullchain.pem"
if [[ -f "$CERT_FILE" ]]; then
    EXPIRY=$(openssl x509 -in "$CERT_FILE" -noout -enddate 2>/dev/null | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
    
    if [[ "$DAYS_LEFT" -gt 30 ]]; then
        check "Certificate — valid, expires in $DAYS_LEFT days" "ok"
    elif [[ "$DAYS_LEFT" -gt 0 ]]; then
        check "Certificate — expires in $DAYS_LEFT days!" "warn"
    else
        check "Certificate — EXPIRED!" "fail"
    fi
else
    check "Certificate — not found (self-signed or not configured)" "warn"
fi
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${YELLOW}$WARN warnings${NC}, ${RED}$FAIL failed${NC}"
echo "═══════════════════════════════════════════════════════════════"

exit $FAIL
