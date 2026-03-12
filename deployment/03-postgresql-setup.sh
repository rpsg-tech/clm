#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — Phase 3: PostgreSQL 16 + pgvector Setup
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
PG_DATA="/mnt/data/postgres"
DB_NAME="clm"
DB_USER="clmuser"
DB_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)

# ─── 1. Install PostgreSQL 16 from PGDG ─────────────────────────────────────
info "Installing PostgreSQL 16 from PGDG repository..."

# Disable RHEL built-in PostgreSQL module (ships PG 15)
dnf module disable -y postgresql 2>/dev/null || true

# Install PGDG repo
dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm 2>/dev/null || warn "PGDG repo already installed"

# Install PostgreSQL 16 + contrib + pgvector
dnf install -y postgresql16-server postgresql16-contrib postgresql16-devel pgvector_16

log "PostgreSQL 16 + pgvector installed"

# ─── 2. Move Data Directory to /mnt/data ────────────────────────────────────
info "Setting up data directory at $PG_DATA..."

# Stop PostgreSQL if running
systemctl stop postgresql-16 2>/dev/null || true

# Create data directory if not exists
mkdir -p "$PG_DATA"
chown postgres:postgres "$PG_DATA"
chmod 700 "$PG_DATA"

# Check if already initialized
if [[ -f "$PG_DATA/PG_VERSION" ]]; then
    warn "PostgreSQL data directory already initialized, skipping initdb"
else
    # Initialize database with custom data directory
    /usr/pgsql-16/bin/postgresql-16-setup initdb

    # Move data to /mnt/data/postgres
    if [[ -d /var/lib/pgsql/16/data ]] && [[ ! -f "$PG_DATA/PG_VERSION" ]]; then
        info "Moving data directory to $PG_DATA..."
        rsync -av /var/lib/pgsql/16/data/ "$PG_DATA/"
        chown -R postgres:postgres "$PG_DATA"
    fi

    log "Database initialized at $PG_DATA"
fi

# ─── 3. Configure PostgreSQL ────────────────────────────────────────────────
info "Configuring PostgreSQL..."

# Update systemd to use custom data directory
mkdir -p /etc/systemd/system/postgresql-16.service.d
cat > /etc/systemd/system/postgresql-16.service.d/override.conf << EOF
[Service]
Environment=PGDATA=$PG_DATA
EOF
systemctl daemon-reload

# Apply performance tuning
if [[ -f "$SCRIPT_DIR/conf/postgresql-tuning.conf" ]]; then
    cp "$SCRIPT_DIR/conf/postgresql-tuning.conf" "$PG_DATA/conf.d/" 2>/dev/null || {
        # If conf.d doesn't exist, include directly
        mkdir -p "$PG_DATA/conf.d"
        chown postgres:postgres "$PG_DATA/conf.d"
        cp "$SCRIPT_DIR/conf/postgresql-tuning.conf" "$PG_DATA/conf.d/"
        chown postgres:postgres "$PG_DATA/conf.d/postgresql-tuning.conf"
        # Add include_dir to postgresql.conf if not already present
        grep -q "include_dir = 'conf.d'" "$PG_DATA/postgresql.conf" 2>/dev/null || \
            echo "include_dir = 'conf.d'" >> "$PG_DATA/postgresql.conf"
    }
    log "Performance tuning applied"
else
    warn "postgresql-tuning.conf not found, using defaults"
fi

# Configure pg_hba.conf (authentication)
cat > "$PG_DATA/pg_hba.conf" << 'HBA'
# TYPE  DATABASE    USER        ADDRESS         METHOD
# Local connections
local   all         postgres                    peer
local   all         all                         peer

# IPv4 local connections (app → database)
host    clm         clmuser     127.0.0.1/32    scram-sha-256

# IPv6 local connections
host    clm         clmuser     ::1/128         scram-sha-256

# Reject all other connections
host    all         all         0.0.0.0/0       reject
HBA

chown postgres:postgres "$PG_DATA/pg_hba.conf"
log "pg_hba.conf configured (scram-sha-256, localhost only)"

# ─── 4. SELinux Context for Custom Data Dir ──────────────────────────────────
info "Setting SELinux context for $PG_DATA..."
semanage fcontext -a -t postgresql_db_t "$PG_DATA(/.*)?" 2>/dev/null || true
restorecon -Rv "$PG_DATA" 2>/dev/null || true
log "SELinux context applied"

# ─── 5. Start PostgreSQL ────────────────────────────────────────────────────
info "Starting PostgreSQL..."
systemctl enable --now postgresql-16
sleep 2

# Verify it's running
if systemctl is-active --quiet postgresql-16; then
    log "PostgreSQL 16 is running"
else
    err "PostgreSQL failed to start. Check: journalctl -u postgresql-16"
fi

# ─── 6. Create Database and User ────────────────────────────────────────────
info "Creating database '$DB_NAME' and user '$DB_USER'..."

sudo -u postgres psql -v ON_ERROR_STOP=1 << EOSQL
-- Create user (if not exists)
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
        CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
        RAISE NOTICE 'User ${DB_USER} created';
    ELSE
        ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASS}';
        RAISE NOTICE 'User ${DB_USER} password updated';
    END IF;
END
\$\$;

-- Create database (if not exists)
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec

-- Connect to the database and set up extensions
\c ${DB_NAME}
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
EOSQL

log "Database '$DB_NAME' created with user '$DB_USER'"
log "Extensions: vector, uuid-ossp"

# ─── 7. Save Credentials ────────────────────────────────────────────────────
CRED_FILE="/opt/clm/.pg-credentials"
cat > "$CRED_FILE" << EOF
# PostgreSQL Credentials (generated $(date +%Y-%m-%d))
# KEEP THIS FILE SECURE — delete after adding to .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASS=${DB_PASS}
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public&connection_limit=20"
EOF
chown clmadmin:clmadmin "$CRED_FILE"
chmod 600 "$CRED_FILE"

log "Credentials saved to $CRED_FILE (chmod 600)"

# ─── 8. Verify ──────────────────────────────────────────────────────────────
info "Verifying PostgreSQL setup..."

PG_VER=$(sudo -u postgres psql -t -c "SELECT version();" | head -1 | xargs)
VECTOR_EXT=$(sudo -u postgres psql -t -d "$DB_NAME" -c "SELECT extname FROM pg_extension WHERE extname='vector';" | xargs)

echo ""
echo "  PostgreSQL: $PG_VER"
echo "  Database:   $DB_NAME"
echo "  User:       $DB_USER"
echo "  pgvector:   ${VECTOR_EXT:-NOT INSTALLED}"
echo "  Data dir:   $PG_DATA"
echo "  Credentials: $CRED_FILE"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Phase 3: PostgreSQL Setup — COMPLETE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}IMPORTANT: Copy DATABASE_URL from $CRED_FILE into your .env${NC}"
echo ""
echo "  Next: bash 04-redis-setup.sh"
