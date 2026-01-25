'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner, Badge } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';

export default function SelectOrgPage() {
    const router = useRouter();
    const { user, switchOrg, currentOrg, isAuthenticated, isLoading: authLoading } = useAuth();

    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    // Auto-skip if user has only 1 organization
    useEffect(() => {
        const autoSelectSingleOrg = async () => {
            // Only proceed if user is loaded, has exactly 1 org, and no current org selected
            if (user && user.organizations?.length === 1 && !currentOrg && !isLoading) {
                const orgId = user.organizations[0].id;
                try {
                    setIsLoading(true);
                    await switchOrg(orgId);
                    router.push('/dashboard');
                } catch (err) {
                    // If auto-switch fails, user can manually select
                    console.error('Auto-select failed:', err);
                    setIsLoading(false);
                }
            }
        };

        autoSelectSingleOrg();
    }, [user, currentOrg, switchOrg, router, isLoading]);

    const handleSelectOrg = async () => {
        if (!selectedOrgId) return;

        setError('');
        setIsLoading(true);

        try {
            await switchOrg(selectedOrgId);
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to switch organization';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-primary-50 px-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900">Select Organization</h1>
                    <p className="mt-2 text-neutral-500">
                        Welcome, <span className="font-medium text-neutral-700">{user?.name}</span>
                    </p>
                </div>

                {/* Organization Cards */}
                <Card className="backdrop-blur-sm bg-white/90 shadow-xl">
                    <CardHeader>
                        <CardTitle>Your Organizations</CardTitle>
                        <CardDescription>Choose an organization to continue</CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-error-light text-error text-sm border border-error/20">
                                {error}
                            </div>
                        )}

                        {/* Org List */}
                        <div className="space-y-3">
                            {user?.organizations.map((org) => (
                                <button
                                    key={org.id}
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${selectedOrgId === org.id
                                        ? 'border-primary-500 bg-primary-50 shadow-md'
                                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-neutral-900">{org.name}</h3>
                                            <p className="text-sm text-neutral-500 font-mono">{org.code}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={selectedOrgId === org.id ? 'default' : 'secondary'}>
                                                {org.role}
                                            </Badge>
                                            {selectedOrgId === org.id && (
                                                <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* No orgs */}
                        {user?.organizations?.length === 0 && (
                            <div className="text-center py-8 text-neutral-500">
                                <p>No organizations found.</p>
                                <p className="text-sm">Please contact your administrator.</p>
                            </div>
                        )}

                        {/* Continue Button */}
                        <Button
                            onClick={handleSelectOrg}
                            disabled={!selectedOrgId || isLoading}
                            className="w-full mt-6"
                            size="lg"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Spinner size="sm" className="text-white" />
                                    Loading...
                                </span>
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Logout link */}
                <p className="text-center text-sm text-neutral-500 mt-6">
                    Not you?{' '}
                    <button
                        onClick={() => {
                            router.push('/login');
                        }}
                        className="text-primary-600 hover:underline"
                    >
                        Sign in with a different account
                    </button>
                </p>
            </div>
        </main>
    );
}
