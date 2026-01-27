'use client';

/**
 * Auth Context Provider
 * 
 * Manages authentication state across the application.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
    role: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string, password: string) => Promise<AuthState>;
    logout: () => void;
    switchOrg: (organizationId: string) => Promise<void>;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        currentOrg: null,
        permissions: [],
        role: null,
        isLoading: true,
        isAuthenticated: false,
    });

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Verify session with backend
                const data = await api.auth.me();

                setState((prev) => ({
                    ...prev,
                    user: data.user,
                    currentOrg: data.currentOrg,
                    role: data.role,
                    permissions: data.permissions || [],
                    isAuthenticated: true,
                    isLoading: false,
                }));
            } catch (error) {
                // Session invalid
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await api.auth.login(email, password);

        // Refresh context
        const data = await api.auth.me();

        const newState = {
            user: data.user,
            currentOrg: data.currentOrg,
            permissions: data.permissions || [],
            role: data.role,
            isLoading: false,
            isAuthenticated: true,
        };

        setState(newState);
        return newState; // Return data for immediate use
    }, []);

    const logout = useCallback(async () => {
        try {
            // Attempt to notify backend
            await api.auth.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Always clear local state
            setState({
                user: null,
                currentOrg: null,
                permissions: [],
                role: null,
                isLoading: false,
                isAuthenticated: false,
            });
        }
    }, []);

    const switchOrg = useCallback(async (organizationId: string) => {
        const response = await api.auth.switchOrg(organizationId);

        setState((prev) => ({
            ...prev,
            currentOrg: response.organization,
            permissions: response.permissions,
            role: response.role,
        }));
    }, []);

    const hasPermission = useCallback(
        (permission: string) => {
            return state.permissions.includes(permission);
        },
        [state.permissions],
    );

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                switchOrg,
                hasPermission,
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
