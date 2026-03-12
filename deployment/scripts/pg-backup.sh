#!/usr/bin/env bash
# ==============================================================================
# CLM Enterprise — PostgreSQL Backup Script
# Run by: cron (postgres user) or manually
# ==============================================================================
set -euo pipefail

DB_NAME="clm"
BACKUP_DIR="/mnt/data/backups/postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/clm_${TIMESTAMP}.sql.gz"

echo "$(date '+%Y-%m-%d %H:%M:%S') — Starting PostgreSQL backup..."

# Create backup directory if missing
mkdir -p "$BACKUP_DIR"

# Dump database (compressed)
pg_dump -U postgres \
    --format=custom \
    --compress=6 \
    --verbose \
    --file="$BACKUP_FILE" \
    "$DB_NAME" 2>/dev/null

# Verify backup file exists and is non-empty
if [[ -s "$BACKUP_FILE" ]]; then
    SIZE=$(du -h "$BACKUP_FILE" | awk '{print $1}')
    echo "$(date '+%Y-%m-%d %H:%M:%S') — Backup complete: $BACKUP_FILE ($SIZE)"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') — ERROR: Backup file is empty or missing!"
    exit 1
fi

# Cleanup old backups (older than retention period)
DELETED=$(find "$BACKUP_DIR" -name "clm_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [[ "$DELETED" -gt 0 ]]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') — Cleaned up $DELETED old backup(s) (>${RETENTION_DAYS} days)"
fi

# Summary
TOTAL=$(ls -1 "$BACKUP_DIR"/clm_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')
echo "$(date '+%Y-%m-%d %H:%M:%S') — Total backups: $TOTAL, Total size: $TOTAL_SIZE"
echo "$(date '+%Y-%m-%d %H:%M:%S') — Backup completed successfully"
