'use client';

/**
 * CSRF Provider Component
 * 
 * Initializes CSRF token on app load by fetching the health endpoint.
 */

import { useEffect } from 'react';
import { initializeCsrf } from './api-client';

export function CsrfProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        initializeCsrf();
    }, []);

    return <>{children}</>;
}
