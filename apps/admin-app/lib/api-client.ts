/**
 * API Client for CLM Enterprise - Admin App
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
    if (csrfCookie) return csrfCookie.split('=')[1];
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
        // Handle 403 CSRF errors
        if (response.status === 403 && data.message?.includes('CSRF')) {
            try {
                await fetch(`${API_BASE_URL}/health`, { credentials: 'include' });
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
                // Refresh failed, proceed to throw error
            }
        }

        throw new ApiError(data.message || 'Request failed', response.status, data);
    }

    return data as T;
}

async function refreshTokens(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        return response.ok;
    } catch {
        return false;
    }
}

export const api = {
    auth: {
        login: (email: string, password: string) =>
            authFetch<{ user: any }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }),
        me: () => authFetch<{ user: any; currentOrg: any; role: string; permissions: string[] }>('/auth/me'),
        switchOrg: (organizationId: string) =>
            authFetch<{
                organization: any;
                role: string;
                permissions: string[];
            }>('/auth/switch-org', {
                method: 'POST',
                body: JSON.stringify({ organizationId }),
            }),
        logout: () => authFetch('/auth/logout', { method: 'POST' }),
    },

    users: {
        list: () => authFetch<any[]>('/users'),
        invite: (data: { email: string; roleId: string; organizationIds?: string[]; name?: string }) =>
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

    roles: {
        list: () => authFetch<any[]>('/roles'),
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

    permissions: {
        list: () => authFetch<{ permissions: any[]; grouped: Record<string, any[]> }>('/permissions'),
    },

    organizations: {
        list: (params?: { isActive?: boolean; type?: 'PARENT' | 'ENTITY' }) => {
            const query = new URLSearchParams();
            if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
            if (params?.type) query.set('type', params.type);
            const queryStr = query.toString();
            return authFetch<any[]>(`/organizations${queryStr ? `?${queryStr}` : ''}`);
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

    templates: {
        list: (category?: string) => {
            const query = category ? `?category=${category}` : '';
            return authFetch<any[]>(`/admin/templates${query}`);
        },
        get: (id: string) => authFetch<any>(`/admin/templates/${id}`),
        create: (data: { name: string; code: string; category: string; description?: string; baseContent: string; isGlobal?: boolean }) =>
            authFetch<any>('/admin/templates', {
                method: 'POST',
                body: JSON.stringify(data)
            }),
        update: (id: string, data: { name?: string; description?: string; baseContent?: string; isGlobal?: boolean; isActive?: boolean }) =>
            authFetch<any>(`/admin/templates/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            }),
        enableForOrg: (templateId: string, orgId: string) =>
            authFetch<any>(`/admin/templates/${templateId}/enable/${orgId}`, { method: 'PATCH' }),
        disableForOrg: (templateId: string, orgId: string) =>
            authFetch<any>(`/admin/templates/${templateId}/disable/${orgId}`, { method: 'PATCH' }),
    },

    featureFlags: {
        list: () => authFetch<any[]>('/feature-flags'),
        toggle: (code: string, isEnabled: boolean, config?: any) =>
            authFetch<any>(`/feature-flags/${code}`, {
                method: 'PUT',
                body: JSON.stringify({ isEnabled, config })
            }),
        getAvailable: () => authFetch<any[]>('/feature-flags/available'),
    },

    analytics: {
        getAdminStats: () => authFetch<any>('/analytics/admin/stats'),
    },

    audit: {
        list: (params?: any) => {
            const query = new URLSearchParams();
            if (params?.module) query.set('module', params.module);
            if (params?.action) query.set('action', params.action);
            const queryStr = query.toString();
            return authFetch<{ logs: any[]; total: number }>(`/audit${queryStr ? `?${queryStr}` : ''}`);
        }
    }
};

/**
 * Initialize CSRF token on app load
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
 * Add idempotency key for critical operations
 */
export function withIdempotencyKey(idempotencyKey?: string): { 'Idempotency-Key': string } {
    return {
        'Idempotency-Key': idempotencyKey || crypto.randomUUID(),
    };
}

