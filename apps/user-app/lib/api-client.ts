'use client';
/**
 * API Client for CLM Enterprise - User App
 * 
 * Updated for HttpOnly Cookie Authentication.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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

// Cache for auth.me request to prevent redundant calls
let mePromise: Promise<{ user: any; currentOrg: any; role: string; permissions: string[]; features: any }> | null = null;

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      mePromise = null; // Clear cache on login attempt
      return authFetch<{ user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },

    me: () => {
      if (!mePromise) {
        mePromise = authFetch<{ user: any; currentOrg: any; role: string; permissions: string[]; features: any }>('/auth/me')
          .catch(err => {
            mePromise = null; // Clear cache on failure so retry works
            throw err;
          });
      }
      return mePromise;
    },

    /**
     * Get session data (profile + notification count)
     * Consolidated endpoint to reduce initial load
     */
    session: () => {
      return authFetch<{
        user: any;
        currentOrg: any;
        role: string;
        permissions: string[];
        features: any;
        unreadNotifications: number;
      }>('/auth/session');
    },

    switchOrg: async (organizationId: string) => {
      mePromise = null; // Clear cache as org context changes
      return authFetch<{
        organization: { id: string; name: string; code: string };
        role: string;
        permissions: string[];
        features: any;
      }>('/auth/switch-org', {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      });
    },

    logout: async () => {
      mePromise = null; // Clear cache
      return authFetch('/auth/logout', { method: 'POST' });
    },
  },

  // Contracts
  contracts: {
    list: (params?: { status?: string; page?: number; limit?: number; expiringDays?: number; search?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set('status', params.status);
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.expiringDays) searchParams.set('expiringDays', params.expiringDays.toString());
      if (params?.search) searchParams.set('search', params.search);
      const query = searchParams.toString();
      return authFetch<{
        data: unknown[];
        meta: { total: number; lastPage: number; currentPage: number; perPage: number; prev: number | null; next: number | null };
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


    analyze: (id: string) =>
      authFetch<any>(`/contracts/${id}/analyze`, { method: 'POST' }),

    getAuditLogs: (id: string) => {
      return authFetch<any[]>(`/contracts/${id}/audit`)
    },

    submit: (id: string, payload?: { target: 'LEGAL' | 'FINANCE' }) =>
      authFetch(`/contracts/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    cancel: (id: string, reason: string) =>
      authFetch(`/contracts/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    send: (id: string) =>
      authFetch(`/contracts/${id}/send`, { method: 'POST' }),

    uploadSigned: async (id: string, file: File) => {
      // Step 1: Get Presigned URL
      const { uploadUrl, key, publicUrl } = await authFetch<{ uploadUrl: string; key: string; publicUrl: string }>(
        `/contracts/${id}/upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
          }),
        }
      );

      // Step 2: Upload directly to S3 (no auth headers, just the signed URL)
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Confirm upload
      return authFetch(`/contracts/${id}/upload-confirm`, {
        method: 'POST',
        body: JSON.stringify({
          key,
          filename: file.name,
        }),
      });
    },

    getDocumentUploadUrl: (id: string, filename: string, contentType: string) =>
      authFetch<{ uploadUrl: string; key: string }>(`/contracts/${id}/document/upload-url`, {
        method: 'POST',
        body: JSON.stringify({ filename, contentType }),
      }),

    confirmDocumentUpload: (id: string, key: string, filename: string, fileSize: number, isFinal?: boolean) =>
      authFetch<any>(`/contracts/${id}/document/upload-confirm`, {
        method: 'POST',
        body: JSON.stringify({ key, filename, fileSize, isFinal }),
      }),

    getAttachmentDownloadUrl: (id: string, attachmentId: string) =>
      authFetch<{ url: string; filename: string; contentType: string }>(`/contracts/${id}/attachments/${attachmentId}/download-url`),

    getVersions: (id: string) => authFetch<any[]>(`/contracts/${id}/versions`),

    getVersion: (id: string, versionId: string) => authFetch<any>(`/contracts/${id}/versions/${versionId}`),

    getVersionChangelog: (id: string, versionId: string) =>
      authFetch<any>(`/contracts/${id}/versions/${versionId}/changelog`),

    compareVersions: (id: string, from: string, to: string) =>
      authFetch<any>(`/contracts/${id}/versions/compare?from=${from}&to=${to}`),

    compare: (id: string, from: string, to: string) =>
      authFetch<any>(`/contracts/${id}/versions/compare?from=${from}&to=${to}`),

    restoreVersion: (id: string, versionId: string) =>
      authFetch<any>(`/contracts/${id}/versions/${versionId}/restore`, { method: 'POST' }),
  },

  // Templates
  templates: {
    list: (params?: { category?: string; page?: number; limit?: number; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.search) query.set('search', params.search);
      const queryStr = query.toString();
      return authFetch<{
        data: unknown[];
        meta: { total: number; lastPage: number; currentPage: number; perPage: number; prev: number | null; next: number | null };
      }>(`/templates${queryStr ? `?${queryStr}` : ''}`);
    },
    get: (id: string) => authFetch(`/templates/${id}`),
    getVariables: (id: string) => authFetch<{ variables: any[]; total: number }>(`/templates/${id}/variables`),

    // Admin Methods
    create: (data: { name: string; code: string; category: string; description?: string; baseContent: string; isGlobal?: boolean; annexures?: any[] }) =>
      authFetch<any>('/admin/templates', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: { name?: string; description?: string; baseContent?: string; isGlobal?: boolean; isActive?: boolean; annexures?: any[] }) =>
      authFetch<any>(`/admin/templates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    enableForOrg: (templateId: string, orgId: string) =>
      authFetch<any>(`/admin/templates/${templateId}/enable/${orgId}`, { method: 'PATCH' }),
    disableForOrg: (templateId: string, orgId: string) =>
      authFetch<any>(`/admin/templates/${templateId}/disable/${orgId}`, { method: 'PATCH' }),
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

    requestRevision: (id: string, comment: string) =>
      authFetch(`/approvals/${id}/request-revision`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      }),

    escalateToLegalHead: (contractId: string, reason?: string) =>
      authFetch(`/approvals/contracts/${contractId}/escalate-to-legal-head`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    returnToManager: (approvalId: string, comment: string) =>
      authFetch(`/approvals/${approvalId}/return`, {
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

    extractDate: (content: string) =>
      authFetch<{ expiryDate: string | null; confidence: number; explanation: string }>('/ai/extract-date', {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    getUploadUrl: (filename: string, contentType: string) =>
      authFetch<{ uploadUrl: string; key: string; publicUrl: string }>('/ai/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename, contentType }),
      }),

    analyzeFile: (key: string) =>
      authFetch<{ expiryDate: string | null; confidence: number; explanation: string }>('/ai/analyze-file', {
        method: 'POST',
        body: JSON.stringify({ key }),
      }),

    chatDocument: (data: { query: string; content: string }) =>
      authFetch<{ content: string }>('/ai/chat-document', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  analytics: {
    contractsSummary: () => authFetch<any>('/analytics/contracts/summary'),
    contractsByStatus: () => authFetch<any>('/analytics/contracts/by-status'),
    contractsTrend: () => authFetch<any>('/analytics/contracts/trend'),
    approvalsMetrics: () => authFetch<any>('/analytics/approvals/metrics'),
    recentActivity: (limit = 10) => authFetch<any>(`/analytics/activity?limit=${limit}`),
    dashboardSnapshot: () => authFetch<any>('/analytics/dashboard-snapshot'), // [PERFORMANCE] Aggregated Endpoint
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
      targetId?: string;
      from?: string;
      to?: string;
      skip?: number;
      take?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.module) searchParams.set('module', params.module);
      if (params?.action) searchParams.set('action', params.action);
      if (params?.userId) searchParams.set('userId', params.userId);
      if (params?.targetId) searchParams.set('targetId', params.targetId);
      if (params?.from) searchParams.set('from', params.from);
      if (params?.to) searchParams.set('to', params.to);
      if (params?.skip !== undefined) searchParams.set('skip', params.skip.toString());
      if (params?.take !== undefined) searchParams.set('take', params.take.toString());
      const query = searchParams.toString();
      return authFetch<{ logs: any[]; total: number }>(`/audit${query ? `?${query}` : ''}`);
    },
  },

  // ============ ADMIN MODULES ============

  // Permissions
  permissions: {
    list: () => authFetch<any>('/permissions'),
  },

  // Organizations
  organizations: {
    list: (params?: { isActive?: boolean; type?: 'PARENT' | 'ENTITY'; page?: number; limit?: number; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
      if (params?.type) query.set('type', params.type);
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.search) query.set('search', params.search);
      const queryStr = query.toString();
      return authFetch<{
        data: any[];
        meta: { total: number; lastPage: number; currentPage: number; perPage: number; prev: number | null; next: number | null };
      }>(`/organizations${queryStr ? `?${queryStr}` : ''}`);
    },
    get: (id: string) => authFetch<any>(`/organizations/${id}`),
    create: (data: { name: string; code: string; type?: 'PARENT' | 'ENTITY'; parentId?: string }) =>
      authFetch<any>('/organizations', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: { name?: string; isActive?: boolean; settings?: any }) =>
      authFetch<any>(`/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    updateSettings: (id: string, settings: Record<string, any>) =>
      authFetch<any>(`/organizations/${id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      }),
    deactivate: (id: string) =>
      authFetch<any>(`/organizations/${id}/deactivate`, { method: 'PUT' }),
  },

  // Users (Admin Context)
  users: {
    list: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.search) query.set('search', params.search);
      if (params?.status) query.set('status', params.status);
      const queryStr = query.toString();
      return authFetch<{
        data: any[];
        meta: { total: number; lastPage: number; currentPage: number; perPage: number; prev: number | null; next: number | null };
      }>(`/users${queryStr ? `?${queryStr}` : ''}`);
    },
    invite: (data: { email: string; roleId: string; organizationIds?: string[]; name?: string; password?: string }) =>
      authFetch('/users/invite', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: { name?: string; email?: string; roleId?: string; isActive?: boolean; organizationIds?: string[] }) =>
      authFetch<any>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
  },

  // Roles
  roles: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', params.page.toString());
      if (params?.limit) query.set('limit', params.limit.toString());
      if (params?.search) query.set('search', params.search);
      const queryStr = query.toString();
      return authFetch<{
        data: any[];
        meta: { total: number; lastPage: number; currentPage: number; perPage: number; prev: number | null; next: number | null };
      }>(`/roles${queryStr ? `?${queryStr}` : ''}`);
    },
    get: (id: string) => authFetch<any>(`/roles/${id}`),
    create: (data: { name: string; code: string; description?: string; permissionIds: string[] }) =>
      authFetch<any>('/roles', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: { name?: string; description?: string; permissionIds?: string[] }) =>
      authFetch<any>(`/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
  },

  // Feature Flags (System Settings)
  featureFlags: {
    list: () => authFetch<any[]>('/feature-flags'),
    toggle: (code: string, isEnabled: boolean, config?: any) =>
      authFetch<any>(`/feature-flags/${code}`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled, config })
      }),
    getAvailable: () => authFetch<any[]>('/feature-flags/available'),
  },

  // Admin Analytics
  analyticsAdmin: {
    getAdminStats: () => authFetch<any>('/analytics/admin/stats'),
  },

  // Oracle AI
  oracle: {
    chat: (data: { query: string; contextUrl?: string; organizationId?: string; contextContent?: string }) =>
      authFetch<{ content: string; context?: any; meta?: any }>('/oracle/chat', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
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

