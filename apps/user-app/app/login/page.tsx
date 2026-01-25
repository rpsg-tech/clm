'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            router.push('/select-org');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-primary-50 px-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-bold">
                            <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                                CLM
                            </span>
                            <span className="text-neutral-600"> Enterprise</span>
                        </h1>
                    </Link>
                    <p className="mt-2 text-neutral-500">Contract Lifecycle Management</p>
                </div>

                {/* Login Card */}
                <Card className="backdrop-blur-sm bg-white/90 shadow-xl border-neutral-200/50">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">Welcome back</CardTitle>
                        <CardDescription>Sign in to your account to continue</CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-error-light text-error text-sm border border-error/20 animate-slide-up">
                                    {error}
                                </div>
                            )}

                            {/* Email */}
                            <Input
                                type="email"
                                label="Email Address"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                autoFocus
                            />

                            {/* Password */}
                            <Input
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />

                            {/* Forgot Password */}
                            <div className="flex justify-end">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Spinner size="sm" className="text-white" />
                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Demo Credentials */}
                        <div className="mt-6 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                            <p className="text-xs font-medium text-neutral-500 mb-2">Demo Credentials:</p>
                            <div className="space-y-1 text-xs text-neutral-600">
                                <p><span className="font-mono bg-neutral-100 px-1 rounded">admin@clm.com</span></p>
                                <p><span className="font-mono bg-neutral-100 px-1 rounded">legal@clm.com</span></p>
                                <p><span className="font-mono bg-neutral-100 px-1 rounded">finance@clm.com</span></p>
                                <p><span className="font-mono bg-neutral-100 px-1 rounded">user@clm.com</span></p>
                                <p className="text-neutral-400 mt-1">Password: <span className="font-mono">Password123!</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-neutral-500 mt-6">
                    © 2026 CLM Enterprise. All rights reserved.
                </p>
            </div>
        </main>
    );
}
