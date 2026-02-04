'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

interface FeatureGuardProps {
    feature: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function FeatureGuard({ feature, children, fallback = null }: FeatureGuardProps) {
    const { isFeatureEnabled } = useAuth();

    if (!isFeatureEnabled(feature)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
