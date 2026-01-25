'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    switchOrg: (organizationId: string) => Promise<void>;
    hasPermission: (permission: string) => boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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
                // Session invalid or expired
                setState((prev) => ({ ...prev, isLoading: false }));
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const response = await api.auth.login(email, password);

        // Check if user has admin permissions
        const adminRoles = ['SUPER_ADMIN', 'ENTITY_ADMIN'];
        const hasAdminRole = response.user.organizations.some((o: { role: string }) =>
            adminRoles.includes(o.role),
        );

        if (!hasAdminRole) {
            throw new Error('Access denied. This portal is for administrators only.');
        }

        // We re-fetch profile to ensure context is fully loaded (redundant but safe)
        // or just rely on backend login response if we updated it to return everything.
        // But login only returns user. Let's rely on /me or just setting user for now and expect dashboard to handle the rest.
        // Actually, let's call `me` to get the full initial context including default inputs if any.
        // For now, let's just set the user and let the dashboard redirect.
        // Wait, `login` return type in `auth.controller.ts` was `{ user: ... }`.

        // Let's call /me immediately to populate org/role context properly
        const data = await api.auth.me();

        setState({
            user: data.user,
            currentOrg: data.currentOrg,
            permissions: data.permissions || [],
            role: data.role,
            isLoading: false,
            isAuthenticated: true,
        });
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.auth.logout();
        } finally {
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

        // setCurrentOrg(response.organization); // No longer needed in localStorage

        setState((prev) => ({
            ...prev,
            currentOrg: response.organization,
            permissions: response.permissions,
            role: response.role,
        }));
    }, []);

    const hasPermission = useCallback(
        (permission: string) => state.permissions.includes(permission),
        [state.permissions],
    );

    const isAdmin = state.role === 'SUPER_ADMIN' || state.role === 'ENTITY_ADMIN';

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                switchOrg,
                hasPermission,
                isAdmin,
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
