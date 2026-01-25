'use client';

import React, { useEffect } from 'react';

export function CsrfProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const initCsrf = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                // Use a simpler check or skip if causing issues, but keeping for now as functionality is needed
                await fetch(`${API_URL}/health`, { credentials: 'include' });
            } catch (error) {
                console.error('Failed to initialize CSRF token:', error);
            }
        };

        initCsrf();
    }, []);

    return <>{children}</>;
}
