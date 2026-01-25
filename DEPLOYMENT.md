# CLM Enterprise - Production Deployment Guide

## Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 15+
- Redis 7+ (optional, for caching)
- Docker & Docker Compose (optional)

---

## Environment Configuration

### Backend (`apps/backend/.env`)

# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://app.yourdomain.com

# Database
DATABASE_URL="postgresql://user:password@host:5432/clm_enterprise?schema=public&connection_limit=20"

# Redis (Required)
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com

# Optional: AI Features
GEMINI_API_KEY=AIzaSy...

# Email Service
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@yourdomain.com
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@clm.com
```

### Frontend Apps

Create `.env.production` in both `apps/user-app` and `apps/admin-app`:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## Build Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Build all apps
npm run build
```

### Production Builds

```bash
# Backend
cd apps/backend
npm run build
node dist/main.js

# User App
cd apps/user-app
npm run build
npm run start

# Admin App
cd apps/admin-app
npm run build
npm run start
```

---

## Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run db:seed
```

---

## Docker Deployment

### docker-compose.production.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      - DATABASE_URL=postgresql://clm:clm_password@postgres:5432/clm_enterprise
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  user-app:
    build:
      context: .
      dockerfile: apps/user-app/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
    ports:
      - "3000:3000"

  admin-app:
    build:
      context: .
      dockerfile: apps/admin-app/Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
    ports:
      - "3002:3002"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=clm_enterprise
      - POSTGRES_USER=clm
      - POSTGRES_PASSWORD=clm_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---


## Security Configuration

### Authentication & Authorization
- **JWT**: Tokens are signed with HS256. Ensure `JWT_SECRET` is rotated periodically.
- **Revocation**: Access tokens are stateless but Refresh tokens are tracked. Revocation uses Redis blacklist.
- **Lockout**: Account locking is enabled (5 failed attempts = 15 min lock).
- **Password**: Minimum 10 characters. Reset flow uses secure email tokens.

### Data Protection
- **Encryption**: All connections to DB and Redis must use TLS in production.
- **Sanitization**: Inputs are sanitized against XSS. Outputs in the frontend are rendered via `SafeHtml`.

### Network Security
- **CSRF**: Enabled for state-changing requests.
- **Rate Limiting**: Throttling enabled (default 100 req/min).
- **Headers**: Helmet enabled (X-Frame-Options, CSP, etc.).
- **Correlation**: All requests tagged with `X-Correlation-ID` for tracing.

---

## Operational Runbook

### Application Startup
1. **Dependencies**: Ensure Redis and PostgreSQL are running.
2. **Migration**: Run `npx prisma migrate deploy` before starting backend.
3. **Environment**: Verify `NODE_ENV=production`.

### Monitoring & Logs
- **Format**: Logs are strictly JSON structured in production.
- **Levels**: Use `LOG_LEVEL` (default: info).
- **Tracing**: Search logs by `traceId` (matches `X-Correlation-ID`).
- **Slow Queries**: Logged automatically if > 100ms (check specific Prisma logs).

### Troubleshooting Scenarios

#### 1. "Account Locked" User Complaints
- **Cause**: Repeated failed logins.
- **Resolution**: Wait 15 minutes or admins can manually clear Redis key: `del lockout:{email}`.

#### 2. "Token Revoked" / 401 Errors
- **Cause**: Token added to blacklist via logout or suspicious activity.
- **Resolution**: User must re-login. Check Redis for `blacklist:{jti}` keys.

#### 3. Database Connection Errors
- **Check**: `DATABASE_URL` pool size (`?connection_limit=X`).
- **Logs**: Look for "Timeout acquiring a connection".

#### 4. Contract Expiry Not Sending
- **Check**: Scheduler runs at midnight. Check logs for "Expiry check completed".
- **Trigger**: Run manual health check or trigger job via admin API (if exposed).

---

## Support

For issues, check:
1. Application logs (JSON format)
2. Database connectivity
3. Environment variables
4. Network/firewall configuration

