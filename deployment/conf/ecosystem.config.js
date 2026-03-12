// ═══════════════════════════════════════════════════════════════════════════════
// CLM Enterprise — PM2 Ecosystem Configuration
// Server: 16 vCPU, 64 GB RAM
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 reload ecosystem.config.js    (zero-downtime restart)
//   pm2 stop ecosystem.config.js
//   pm2 delete ecosystem.config.js
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  apps: [
    // ── NestJS Backend (API) ──────────────────────────────────────────────
    {
      name: 'clm-backend',
      cwd: '/opt/clm/app/apps/backend',
      script: 'dist/main.js',

      // Cluster mode: 8 of 16 vCPUs for the backend
      instances: 8,
      exec_mode: 'cluster',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Memory management
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=2048',

      // Logging
      error_file: '/opt/clm/logs/backend-error.log',
      out_file: '/opt/clm/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      merge_logs: true,

      // Restart behaviour
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000,

      // Graceful shutdown (NestJS shutdown hooks)
      kill_timeout: 8000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
    },

    // ── Next.js Frontend (SSR) ────────────────────────────────────────────
    {
      name: 'clm-frontend',
      cwd: '/opt/clm/app/apps/user-app/.next/standalone',
      script: 'apps/user-app/server.js',

      // Cluster mode: 4 of 16 vCPUs for SSR
      instances: 4,
      exec_mode: 'cluster',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
      },

      // Memory management
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',

      // Logging
      error_file: '/opt/clm/logs/frontend-error.log',
      out_file: '/opt/clm/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      merge_logs: true,

      // Restart behaviour
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '5s',
      restart_delay: 3000,

      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
    },
  ],
};
