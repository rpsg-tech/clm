'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';

export default function AdminLoginPage() {
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
            router.push('/dashboard');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-4xl font-bold">
                            <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                                CLM
                            </span>
                            <span className="text-neutral-400"> Admin</span>
                        </h1>
                    </Link>
                    <p className="mt-2 text-neutral-500">Administration Portal</p>
                </div>

                {/* Login Card */}
                <Card className="bg-neutral-800/50 border-neutral-700 backdrop-blur-sm shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
                        <CardDescription className="text-neutral-400">
                            Sign in with your administrator account
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Error Message */}
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                                    {error}
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    placeholder="admin@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                    autoFocus
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="w-full px-4 py-2 rounded-lg bg-neutral-700/50 border border-neutral-600 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
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

                        {/* Admin Credentials Hint */}
                        <div className="mt-6 p-4 rounded-lg bg-neutral-700/30 border border-neutral-600">
                            <p className="text-xs font-medium text-neutral-400 mb-2">Admin Demo Account:</p>
                            <div className="space-y-1 text-xs text-neutral-300">
                                <p><span className="font-mono bg-neutral-700 px-1 rounded">admin@clm.com</span></p>
                                <p className="text-neutral-500 mt-1">Password: <span className="font-mono">Password123!</span></p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-neutral-500 mt-6">
                    © 2026 CLM Enterprise. Admin Portal.
                </p>
            </div>
        </main>
    );
}
