'use client';

/**
 * CSRF Provider Component
 * 
 * Initializes CSRF token on app load by fetching the health endpoint.
 * This ensures the XSRF-TOKEN cookie is set before any API calls are made.
 */

import { useEffect } from 'react';

export function CsrfProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Initialize CSRF token when app loads
        const initCsrf = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                await fetch(`${API_URL}/health`, { credentials: 'include' });
            } catch (error) {
                console.error('Failed to initialize CSRF token:', error);
            }
        };

        initCsrf();
    }, []);

    return <>{children}</>;
}
