# CLM Enterprise Platform

Enterprise-grade Contract Lifecycle Management (CLM) platform built with modern technologies.

## 🏗️ Architecture

This is a **Turborepo monorepo** with the following structure:

```
clm-enterprise/
├── apps/
│   ├── backend/       # NestJS API Server
│   ├── user-app/      # Next.js User Application
│   └── admin-app/     # Next.js Admin Application
├── packages/
│   ├── ui/            # Shared UI components
│   ├── types/         # Shared TypeScript types
│   ├── eslint-config/ # ESLint configurations
│   └── typescript-config/ # TypeScript configurations
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (via Docker or external)
- Redis (via Docker or Upstash)

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

### Individual Apps

```bash
# Backend only
npm run dev:backend

# User App only
npm run dev:user

# Admin App only
npm run dev:admin
```

## 📦 Tech Stack

### Backend
- **NestJS** - Modular Node.js framework
- **Prisma** - Type-safe ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching & job queues
- **BullMQ** - Background job processing

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations

### Infrastructure
- **Docker** - Containerization
- **Turborepo** - Monorepo management
- **AWS S3** - Document storage

## 🔐 Security

- JWT authentication with refresh tokens
- Role-Based Access Control (RBAC)
- Organization-level data isolation
- Input validation on all endpoints
- Audit logging for all mutations

## 📊 Quality Standards

- **Lighthouse Score**: ≥ 90
- **API Response (p95)**: < 200ms
- **Test Coverage**: ≥ 80%
- **Accessibility**: WCAG 2.1 AA

## 📁 Environment Variables

Create `.env` files in each app directory. See `.env.example` for required variables.

## 📝 License

Proprietary - All Rights Reserved
