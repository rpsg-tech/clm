'use client';
/**
 * API Client for CLM Enterprise - User App
 * 
 * Updated for HttpOnly Cookie Authentication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(c => c.trim().startsWith('XSRF-TOKEN='));

  if (csrfCookie) {
    return csrfCookie.split('=')[1];
  }

  return null;
}

/**
 * Fetch wrapper that handles:
 * - JSON headers
 * - Credentials (Cookies)
 * - CSRF protection
 * - Error handling
 * - Automatic token refresh (via 401 interception)
 * - Rate limiting (429)
 */
async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase() || 'GET';
  const methodsRequiringCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'];

  if (methodsRequiringCsrf.includes(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Send cookies
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Handle 403 CSRF errors - try to refresh CSRF token
    if (response.status === 403 && data.message?.includes('CSRF')) {
      try {
        // Fetch new CSRF token
        await fetch(`${API_BASE_URL}/health`, { credentials: 'include' });
        // Retry original request
        return authFetch<T>(endpoint, options);
      } catch (e) {
        throw new ApiError('CSRF token refresh failed', 403, data);
      }
    }

    // Handle 429 Rate Limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new ApiError(
        `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
        429,
        { retryAfter: parseInt(retryAfter) }
      );
    }

    // Intercept 401 to try refresh
    if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/refresh')) {
      try {
        const refreshed = await refreshTokens();
        if (refreshed) {
          // Retry original request
          return authFetch<T>(endpoint, options);
        }
      } catch (e) {
        // Refresh failed
      }
    }

    throw new ApiError(data.message || 'Request failed', response.status, data);
  }

  return data as T;
}

async function refreshTokens(): Promise<boolean> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      authFetch<{ user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    me: () => authFetch<{ user: any; currentOrg: any; role: string; permissions: string[] }>('/auth/me'),

    switchOrg: (organizationId: string) =>
      authFetch<{
        organization: { id: string; name: string; code: string };
        role: string;
        permissions: string[];
      }>('/auth/switch-org', {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      }),

    logout: () => authFetch('/auth/logout', { method: 'POST' }),
  },

  // Contracts
  contracts: {
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      const query = searchParams.toString();
      return authFetch<{
        contracts: unknown[];
        total: number;
      }>(`/contracts${query ? `?${query}` : ''}`);
    },

    get: (id: string) => authFetch(`/contracts/${id}`),

    create: (data: {
      templateId: string;
      title: string;
      counterpartyName?: string;
      counterpartyEmail?: string;
      startDate?: string;
      endDate?: string;
      amount?: number;
      description?: string;
      annexureData: string;
      fieldData: Record<string, unknown>;
    }) =>
      authFetch('/contracts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<{ title: string; annexureData: string; fieldData: Record<string, unknown> }>) =>
      authFetch(`/contracts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    submit: (id: string) =>
      authFetch(`/contracts/${id}/submit`, { method: 'POST' }),

    send: (id: string) =>
      authFetch(`/contracts/${id}/send`, { method: 'POST' }),

    uploadSigned: (id: string, filename?: string) =>
      authFetch(`/contracts/${id}/upload-signed`, {
        method: 'POST',
        body: JSON.stringify({ filename }),
      }),

    getVersions: (id: string) => authFetch<any[]>(`/contracts/${id}/versions`),

    getVersionChangelog: (id: string, versionId: string) =>
      authFetch<any>(`/contracts/${id}/versions/${versionId}/changelog`),

    compare: (id: string, from: string, to: string) =>
      authFetch<any>(`/contracts/${id}/compare?from=${from}&to=${to}`),
  },

  // Templates
  templates: {
    list: () => authFetch('/templates'),
    get: (id: string) => authFetch(`/templates/${id}`),
  },

  // Approvals
  approvals: {
    pending: (type: 'LEGAL' | 'FINANCE') =>
      authFetch(`/approvals/pending?type=${type}`),

    approve: (id: string, comment?: string) =>
      authFetch(`/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),

    reject: (id: string, comment: string) =>
      authFetch(`/approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),
  },

  // Health
  health: {
    check: () => authFetch('/health'),
  },

  // AI & Analytics omitted for brevity but should be here if used.
  // Including essential AI for completeness as file had it
  ai: {
    analyze: (content: string, title?: string) =>
      authFetch<any>('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ content, title }),
      }),

    suggestClause: (clauseType: string, context?: string) =>
      authFetch<any>('/ai/suggest-clause', {
        method: 'POST',
        body: JSON.stringify({ clauseType, context }),
      }),

    improveClause: (clause: string) =>
      authFetch<any>('/ai/improve-clause', {
        method: 'POST',
        body: JSON.stringify({ clause }),
      }),

    getClauseTypes: () =>
      authFetch<any>('/ai/clause-types'),
  },

  analytics: {
    contractsSummary: () => authFetch<any>('/analytics/contracts/summary'),
    contractsByStatus: () => authFetch<any>('/analytics/contracts/by-status'),
    contractsTrend: () => authFetch<any>('/analytics/contracts/trend'),
    approvalsMetrics: () => authFetch<any>('/analytics/approvals/metrics'),
    recentActivity: (limit = 10) => authFetch<any>(`/analytics/activity?limit=${limit}`),
  },

  // Notifications
  notifications: {
    list: () => authFetch<{ notifications: any[]; unreadCount: number }>('/notifications'),

    markRead: (id: string) =>
      authFetch(`/notifications/${id}/read`, { method: 'PATCH' }),

    markAllRead: () =>
      authFetch('/notifications/read-all', { method: 'PATCH' }),
  },

  // Audit Logs
  audit: {
    getLogs: (params?: {
      module?: string;
      action?: string;
      userId?: string;
      from?: string;
      to?: string;
      skip?: number;
      take?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.module) searchParams.set('module', params.module);
      if (params?.action) searchParams.set('action', params.action);
      if (params?.userId) searchParams.set('userId', params.userId);
      if (params?.from) searchParams.set('from', params.from);
      if (params?.to) searchParams.set('to', params.to);
      if (params?.skip !== undefined) searchParams.set('skip', params.skip.toString());
      if (params?.take !== undefined) searchParams.set('take', params.take.toString());
      const query = searchParams.toString();
      return authFetch<{ logs: any[]; total: number }>(`/audit${query ? `?${query}` : ''}`);
    },
  },
};

/**
 * Initialize CSRF token on app load
 * Call this in your app layout or provider
 */
export async function initializeCsrf(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/health`, { credentials: 'include' });
    console.log('✅ CSRF token initialized');
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
}

/**
 * Add idempotency key to a request for critical operations
 * Prevents duplicate processing due to network retries
 */
export function withIdempotencyKey(idempotencyKey?: string): { 'Idempotency-Key': string } {
  return {
    'Idempotency-Key': idempotencyKey || crypto.randomUUID(),
  };
}

