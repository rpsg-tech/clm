# Operations Runbook - CLM Enterprise

**Scope:** Full Platform Deployment & Maintenance

## 1. Deployment Checklist

### 1.1 Pre-Flight Checks
- [ ] **Database**:
    -   PostgreSQL connection limits configured (Pooling).
    -   `pgvector` extension enabled.
    -   Statistics updated (`ANALYZE`).
- [ ] **Environment**:
    -   `NODE_ENV=production`
    -   `JWT_SECRET` (min 32 chars)
    -   `DATABASE_URL` (with params `?connection_limit=5`)
    -   `REDIS_URL` reachable.

### 1.2 Deployment Pipeline
1.  **Build**:
    ```bash
    docker build -t clm-backend:latest -f apps/backend/Dockerfile .
    ```
2.  **Migration**:
    > **CRITICAL**: Always run migrations before starting the new application version.
    ```bash
    docker run --rm --env-file .env clm-backend:latest npx prisma migrate deploy
    ```
3.  **Start**:
    ```bash
    docker run -d --name clm-api -p 4000:4000 --env-file .env --restart always clm-backend:latest
    ```

## 2. Monitoring & Observability

### 2.1 Health Endpoints
-   **Liveness**: `/api/health` - Simple uptime check.
-   **Readiness**: `/api/health` - Checks DB and Redis connectivity.

### 2.2 Critical Alerts
| Service | Metric | Threshold | Severity |
|---------|--------|-----------|----------|
| **Backend** | HTTP 5xx Rate | > 1% | High |
| **DB** | CPU Usage | > 80% | High |
| **Redis** | Memory Usage | > 80% | Medium |
| **Jobs** | Failed Job Count | > 10 | Medium |

### 2.3 Logs
-   Logs are output as JSON to `stdout`.
-   **Must** be aggregated to CloudWatch/Datadog/ELK.
-   **Filter**: Search `level: "error"` for immediate issues.

## 3. Maintenance Procedures

### 3.1 Database & Migrations
-   **Rollback**: Prisma does not support auto-rollback. Restore from backup if migration fails corruptively.
-   **Seeding**: Use `npx prisma db seed` only for fresh setups, not production updates.

### 3.2 Redis Cache
-   **Clearing Cache**:
    -   Safe to flush `oracle:*` keys.
    -   **Avoid** flushing sessions if using Redis store.

### 3.3 Secrets Rotation
1.  Update `JWT_SECRET` in `.env`.
2.  Restart Backend.
3.  **Impact**: All users will be logged out immediately.

## 4. Troubleshooting

### "Connection Refused" to Database
-   Check VPC peering / Security Groups.
-   Check if `DATABASE_URL` is correct.

### "Token Invalid" / 401 Errors
-   Check clock synchronization on server.
-   Verify `JWT_SECRET` matches across instances.
-   Check if token is blacklisted in Redis.

## 5. Backup Strategy
-   **Database**: Daily Full Backup + WAL Archiving (PITR) enabled.
-   **S3**: Versioning enabled on buckets.
