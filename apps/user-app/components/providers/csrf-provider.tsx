'use client';

import React, { useEffect } from 'react';

export function CsrfProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initCsrf = async () => {
            try {
                // Check if CSRF token already exists in cookies
                // This prevents redundant polling on every mount if the session is active
                const hasCsrfToken = document.cookie.split(';').some(c => c.trim().startsWith('XSRF-TOKEN='));

                if (!hasCsrfToken) {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                    await fetch(`${API_URL}/health`, { credentials: 'include' });
                }
            } catch (error) {
                console.error('Failed to initialize CSRF token:', error);
            }
        };

        initCsrf();
    }, []);

    return <>{children}</>;
}
