'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { error: showError } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        try {
            const state = await login(email, password);
            if (state.isAuthenticated) {
                router.replace(state.currentOrg ? (from || '/dashboard') : '/select-org');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Invalid email or password';
            showError('Login failed', message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full space-y-8">
            <div className="text-center lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900">Welcome back</h2>
                <p className="mt-2 text-neutral-500 text-sm">Please enter your details to sign in.</p>
            </div>

            {/* SSO Button */}
            <button
                type="button"
                aria-label="Sign in with Microsoft"
                className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-black text-white h-12 px-5 rounded-md transition-all duration-200 font-medium text-sm shadow-sm"
            >
                <MaterialIcon name="grid_view" size={20} className="text-white" />
                <span>Sign in with Microsoft</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-neutral-200" />
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-neutral-200" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">Email</span>
                    <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full rounded-md border border-neutral-300 bg-white text-neutral-900 h-11 px-3 text-sm placeholder:text-neutral-400 focus:border-indigo-700 focus:ring-indigo-700/20 transition-all"
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">Password</span>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-md border border-neutral-300 bg-white text-neutral-900 h-11 px-3 text-sm placeholder:text-neutral-400 focus:border-indigo-700 focus:ring-indigo-700/20 transition-all"
                    />
                </label>

                <div className="flex items-center justify-between mt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-neutral-300 text-indigo-700 focus:ring-indigo-700/20" />
                        <span className="text-xs text-neutral-600">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-xs font-medium text-indigo-700 hover:text-indigo-800 transition-colors">
                        Forgot password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 w-full bg-indigo-700 hover:bg-indigo-800 text-white h-11 rounded-md font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    {isLoading ? 'Signing in...' : 'Sign in with Email'}
                </button>
            </form>

            {/* Footer */}
            <div className="pt-4 text-center space-y-4">
                <p className="text-xs text-neutral-400">Contact your administrator for account access.</p>
                <p className="text-[10px] text-neutral-300 leading-relaxed max-w-xs mx-auto">
                    Supported Roles: Super Admin • Entity Admin • Legal Head • Legal Manager • Finance Manager • Business User
                </p>
            </div>
        </div>
    );
}
