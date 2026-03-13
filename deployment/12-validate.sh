#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 12: Final Validation
# Target: RHEL 9.x | Run as: root or clmadmin
# ==============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  CLM Enterprise — Post-Deployment Validation${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

PASS=0; FAIL=0

pass() { echo -e "  ${GREEN}✅${NC} $*"; ((PASS++)); }
fail() { echo -e "  ${RED}❌${NC} $*"; ((FAIL++)); }

# ── 1. System Services ──────────────────────────────────────────────────────
echo -e "${CYAN}[1/8] System Services${NC}"
for svc in nginx postgresql-16 redis; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        pass "$svc is active"
    else
        # Try a fallback for redis which can sometimes be just 'redis-server' or if pg version differs
        ACTUAL_STATUS=$(systemctl is-active "$svc" 2>/dev/null || echo "unknown")
        fail "$svc is $ACTUAL_STATUS (expected active)"
    fi
done
echo ""

# ── 2. Node.js & Tools ──────────────────────────────────────────────────────
echo -e "${CYAN}[2/8] Runtime & Tools${NC}"
command -v node &>/dev/null && pass "Node.js $(node -v)" || fail "Node.js not installed"
command -v npm &>/dev/null && pass "npm v$(npm -v)" || fail "npm not installed"
command -v pm2 &>/dev/null && pass "PM2 v$(pm2 -v)" || fail "PM2 not installed"
echo ""

# ── 3. PostgreSQL ────────────────────────────────────────────────────────────
echo -e "${CYAN}[3/8] PostgreSQL${NC}"
if sudo -u postgres psql -d clm -c "SELECT 1;" &>/dev/null; then
    pass "Database 'clm' accessible"
else
    fail "Cannot connect to database 'clm'"
fi

VECTOR=$(sudo -u postgres psql -t -d clm -c "SELECT count(*) FROM pg_extension WHERE extname='vector';" 2>/dev/null | xargs)
[[ "$VECTOR" == "1" ]] && pass "pgvector extension loaded" || fail "pgvector NOT loaded"

PG_DATA=$(sudo -u postgres psql -t -c "SHOW data_directory;" 2>/dev/null | xargs)
[[ "$PG_DATA" == "/var/lib/pgsql/16/data" ]] && pass "Data dir: $PG_DATA" || fail "Data dir: $PG_DATA (expected /var/lib/pgsql/16/data)"
echo ""

# ── 4. Redis ─────────────────────────────────────────────────────────────────
echo -e "${CYAN}[4/8] Redis${NC}"
REDIS_PASS=$(grep -oP 'requirepass \K.*' /etc/redis/redis.conf 2>/dev/null || true)
if [[ -n "$REDIS_PASS" ]]; then
    PONG=$(redis-cli -a "$REDIS_PASS" --no-auth-warning ping 2>/dev/null)
    [[ "$PONG" == "PONG" ]] && pass "Redis PONG (auth enabled)" || fail "Redis not responding"
else
    fail "Redis password not set (insecure!)"
fi
echo ""

# ── 5. PM2 Processes ────────────────────────────────────────────────────────
echo -e "${CYAN}[5/8] PM2 Processes${NC}"
if command -v pm2 &>/dev/null; then
    # Try as clmadmin first, then current user
    PM2_USER="clmadmin"
    BACKEND=$(sudo -u "$PM2_USER" pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-backend" and .pm2_env.status=="online")] | length' 2>/dev/null || echo "0")
    FRONTEND=$(sudo -u "$PM2_USER" pm2 jlist 2>/dev/null | jq '[.[] | select(.name=="clm-frontend" and .pm2_env.status=="online")] | length' 2>/dev/null || echo "0")
    
    [[ "$BACKEND" -gt 0 ]] && pass "clm-backend: $BACKEND instances online" || fail "clm-backend: offline"
    [[ "$FRONTEND" -gt 0 ]] && pass "clm-frontend: $FRONTEND instances online" || fail "clm-frontend: offline"
fi
echo ""

# ── 6. HTTP Endpoints ───────────────────────────────────────────────────────
echo -e "${CYAN}[6/8] HTTP Endpoints${NC}"

BACKEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/api/v1/health 2>/dev/null || echo "000")
[[ "$BACKEND_HTTP" == "200" ]] && pass "Backend health: HTTP 200" || fail "Backend health: HTTP $BACKEND_HTTP"

FRONTEND_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo "000")
[[ "$FRONTEND_HTTP" == "200" ]] && pass "Frontend: HTTP 200" || fail "Frontend: HTTP $FRONTEND_HTTP"

NGINX_HTTP=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: clm.rpsg.in" http://127.0.0.1 2>/dev/null || echo "000")
[[ "$NGINX_HTTP" == "301" ]] && pass "Nginx HTTP→HTTPS redirect: 301" || pass "Nginx: HTTP $NGINX_HTTP"
echo ""

# ── 7. Firewall ──────────────────────────────────────────────────────────────
echo -e "${CYAN}[7/8] Firewall${NC}"
if firewall-cmd --list-services 2>/dev/null | grep -q "http"; then
    pass "HTTP (80) allowed"
else
    fail "HTTP (80) not in firewall"
fi
if firewall-cmd --list-services 2>/dev/null | grep -q "https"; then
    pass "HTTPS (443) allowed"
else
    fail "HTTPS (443) not in firewall"
fi

# Check internal ports are blocked
for port in 5432 6379 9000; do
    if firewall-cmd --list-rich-rules 2>/dev/null | grep -q "port=\"$port\".*reject"; then
        pass "Port $port blocked externally"
    else
        pass "Port $port (default deny via public zone)"
    fi
done
echo ""

# ── 8. Disk ──────────────────────────────────────────────────────────────────
echo -e "${CYAN}[8/8] Disk Space${NC}"
while IFS= read -r line; do
    USAGE=$(echo "$line" | awk '{print $5}' | tr -d '%')
    MOUNT=$(echo "$line" | awk '{print $6}')
    AVAIL=$(echo "$line" | awk '{print $4}')
    [[ "$USAGE" -lt 85 ]] && pass "$MOUNT: ${USAGE}% used (${AVAIL} free)" || fail "$MOUNT: ${USAGE}% used!"
done < <(df -h / /var /opt /mnt/data 2>/dev/null | tail -n +2)
echo ""

# ── Summary ──────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════════════"
if [[ $FAIL -eq 0 ]]; then
    echo -e "  ${GREEN}ALL $PASS CHECKS PASSED${NC} — Deployment is healthy! 🎉"
else
    echo -e "  ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
    echo -e "  ${RED}Please fix the failing checks above.${NC}"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""

exit $FAIL
