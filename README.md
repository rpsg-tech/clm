# CLM Enterprise Platform

Enterprise-grade Contract Lifecycle Management (CLM) platform built with modern technologies.

## 🎨 Frontend Rebuild (feat/frontend-rebuild)

This branch contains a **complete frontend UI/UX rebuild** developed using:

- **Product Requirements:** Comprehensive PRD documented in [`CLM-PRD.md`](./CLM-PRD.md)
- **Design System:** Stitch-generated designs with detailed specifications in [`STITCH_DESIGN_BRIEF.md`](./STITCH_DESIGN_BRIEF.md)
- **Design References:**
  - Interactive mockups in `stitch_clm_redesign_stitch/` directory
  - Design guide in [`stitch-designguide.md`](./stitch-designguide.md)
- **Implementation Tracking:** Phase-by-phase progress in [`CLM_STATE.md`](./CLM_STATE.md)

### Rebuild Scope
- ✅ **Phases 0-10 Complete:** Dashboard, Contracts, Templates, Approvals, Admin pages
- 🎯 **Design-First Approach:** Every component built from Stitch mockups and PRD specs
- 🏗️ **Next Step:** Stability refactoring and backend integration by dev team

### Tech Stack (Frontend)
- **Next.js 15.5** with React 19 and App Router
- **Tailwind V4** with custom design tokens (Indigo 700 primary, Slate 50 background)
- **React Query** for data fetching and state management
- **Material Symbols** for consistent iconography
- **Radix UI** components for accessibility

**Note to Dev Team:** This rebuild prioritized UI/UX completeness over backend stability. Please review, refactor, and integrate with production backend before merging to main.

## 🏗️ Architecture

This is a **Turborepo monorepo** with the following structure:

```
clm-enterprise/
├── apps/
│   ├── backend/       # NestJS API Server (Modular, Scalable)
│   ├── user-app/      # Next.js User Application (App Router)
├── packages/
│   ├── ui/            # Shared UI components
│   ├── types/         # Shared TypeScript types
│   ├── eslint-config/ # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **Docker & Docker Compose**
- **PostgreSQL** (Active instances required)
- **Redis** (Critical for Rate Limiting & Auth)

### Development Setup

```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start all apps in development
npm run dev
```

## 📦 Production Deployment

### 1. Build & Optimize
Our Dockerfiles are optimized for production. They automatically prune `devDependencies` to keep images lightweight.

```bash
# Build production images
docker-compose -f docker-compose.production.yml build
```

### 2. Environment Configuration
Ensure `.env` files are configured for production:

**Backend (`apps/backend/.env`):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://... (Required for Global Rate Limiting)
ENABLE_SWAGGER=true   # Optional: Enable API Docs in Prod
JWT_SECRET=...        # Strong 32+ char secret
```

### 3. Scalability
- **Rate Limiting:** Uses **Redis** storage (`RedisThrottlerStorage`). This allows the backend to scale horizontally while maintaining accurate global rate limits.
- **Stateless:** The backend is fully stateless; sessions are managed via JWTs and Redis.

## ⚠️ Production Status: Risk Accepted

**Current Status:** `Conditionally Ready`

> [!WARNING]
> **Testing Gap:** The system currently lacks comprehensive automated tests.
> Deployment proceeds under "Risk Accepted" status.
> **DevOps Note:** Rate limiting and Docker image sizes have been optimized.

## 📦 Tech Stack

### Backend
- **NestJS** - Modular Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **Redis** - Distributed Throttling & Caching
- **BullMQ** - Background job processing

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations

## 📝 License

Proprietary - All Rights Reserved
