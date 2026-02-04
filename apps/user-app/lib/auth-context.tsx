'use client';

/**
 Auth Context Provider with React Query

 Implements smart caching and sessionStorage persistence for optimal performance.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface User {
    id: string;
    email: string;
    name: string;
    organizations: Array<{
        id: string;
        name: string;
        code: string;
        role: string;
    }>;
}

interface Organization {
    id: string;
    name: string;
    code: string;
}

interface AuthState {
    user: User | null;
    currentOrg: Organization | null;
    permissions: string[];
    features: Record<string, boolean>;
    role: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<AuthState>;
    logout: () => void;
    switchOrg: (organizationId: string) => Promise<void>;
    hasPermission: (permission: string) => boolean;
    isFeatureEnabled: (featureCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_QUERY_KEY = ['auth', 'me'];
const CACHE_KEY = 'clm_auth_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// SessionStorage helpers
function getStoredAuth(): AuthState | null {
    if (typeof window === 'undefined') return null;

    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { state, timestamp } = JSON.parse(cached);

        // Check if cache is still valid
        if (Date.now() - timestamp < CACHE_TTL) {
            return state;
        }

        // Expired, clear it
        sessionStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Failed to parse cached auth:', error);
        sessionStorage.removeItem(CACHE_KEY);
    }

    return null;
}

function setStoredAuth(state: AuthState) {
    if (typeof window === 'undefined') return;

    try {
        sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ state, timestamp: Date.now() })
        );
    } catch (error) {
        console.error('Failed to cache auth:', error);
    }
}

function clearStoredAuth() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(CACHE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    // Load from sessionStorage for instant UI (SSR-safe)
    const cachedState = useMemo(() => getStoredAuth(), []);

    // Use React Query for auth data
    const { data, isLoading, error } = useQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: async () => {
            try {
                return await api.auth.me();
            } catch (err) {
                clearStoredAuth();
                throw err;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false,
        // Use cached data as initial data if available
        initialData: cachedState
            ? {
                user: cachedState.user!,
                currentOrg: cachedState.currentOrg!,
                role: cachedState.role!,
                permissions: cachedState.permissions,
                features: cachedState.features,
            }
            : undefined,
    });

    // Derive state from query data
    const state = useMemo<AuthState>(() => {
        if (isLoading && !cachedState) {
            return {
                user: null,
                currentOrg: null,
                permissions: [],
                features: {},
                role: null,
                isLoading: true,
                isAuthenticated: false,
            };
        }

        if (error || !data) {
            return {
                user: null,
                currentOrg: null,
                permissions: [],
                features: {},
                role: null,
                isLoading: false,
                isAuthenticated: false,
            };
        }

        return {
            user: data.user,
            currentOrg: data.currentOrg,
            role: data.role,
            permissions: data.permissions || [],
            features: data.features || {},
            isAuthenticated: true,
            isLoading: false,
        };
    }, [data, isLoading, error, cachedState]);

    // Persist to sessionStorage whenever auth state changes
    useEffect(() => {
        if (state.isAuthenticated) {
            setStoredAuth(state);
        } else {
            clearStoredAuth();
        }
    }, [state]);

    const login = useCallback(
        async (email: string, password: string) => {
            const response = await api.auth.login(email, password);

            // Refresh context by invalidating and refetching
            await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
            const data = await queryClient.fetchQuery({
                queryKey: AUTH_QUERY_KEY,
                queryFn: () => api.auth.me(),
            });

            const newState: AuthState = {
                user: data.user,
                currentOrg: data.currentOrg,
                permissions: data.permissions || [],
                features: data.features || {},
                role: data.role,
                isLoading: false,
                isAuthenticated: true,
            };

            setStoredAuth(newState);
            return newState;
        },
        [queryClient]
    );

    const logout = useCallback(async () => {
        try {
            // Cancel all ongoing queries first to prevent 401 errors
            await queryClient.cancelQueries();

            // Clear auth state immediately to stop new queries
            clearStoredAuth();

            // Then call logout API
            await api.auth.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Clear all query cache
            queryClient.clear();
        }
    }, [queryClient]);

    const switchOrg = useCallback(
        async (organizationId: string) => {
            const response = await api.auth.switchOrg(organizationId);

            // Update the query cache with new org context
            queryClient.setQueryData(AUTH_QUERY_KEY, (oldData: any) => ({
                ...oldData,
                currentOrg: response.organization,
                permissions: response.permissions,
                features: response.features || {},
                role: response.role,
            }));
        },
        [queryClient]
    );

    const hasPermission = useCallback(
        (permission: string) => {
            return state.permissions.includes(permission);
        },
        [state.permissions]
    );

    const isFeatureEnabled = useCallback(
        (featureCode: string) => {
            return !!state.features[featureCode];
        },
        [state.features]
    );

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                switchOrg,
                hasPermission,
                isFeatureEnabled,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Hook to check if user has required permission(s)
 */
export function usePermission(permission: string | string[]) {
    const { permissions, currentOrg } = useAuth();

    if (!currentOrg) return false;

    if (Array.isArray(permission)) {
        return permission.some((p) => permissions.includes(p));
    }
    return permissions.includes(permission);
}
