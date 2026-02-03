'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Input, Checkbox, Spinner } from '@repo/ui';
import { useAuth } from '@/lib/auth-context';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';

import { Logo } from '@/components/logo';

export default function LoginPage() {
    const router = useRouter();
    const { login, switchOrg } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [keepSignedIn, setKeepSignedIn] = useState(true);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const authState = await login(email, password);

            // Check for Admin Access first
            if (authState.permissions?.includes('admin:access')) {
                router.push('/dashboard/organizations');
                return;
            }

            // Standard User Redirect Logic
            const orgs = authState.user?.organizations || [];

            if (orgs.length === 1) {
                // Auto-select the only organization
                await switchOrg(orgs[0].id);
                router.push('/dashboard');
            } else {
                // Multiple organizations or none -> let them select
                router.push('/select-org');
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white">
            {/* LEFT SIDE: Brand & Art */}
            <div className="hidden lg:flex w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/login-bg.png"
                        alt="Enterprise Background"
                        fill
                        className="object-cover opacity-60 mix-blend-overlay"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/10" />
                </div>

                {/* Top Brand */}
                {/* Top Brand */}
                <div className="relative z-10">
                    <Logo />
                </div>

                {/* Middle Quote */}
                <div className="relative z-10 max-w-lg">
                    <h2 className="text-4xl font-bold leading-tight mb-4">
                        Accelerate deals, <br />
                        <span className="text-orange-500">mitigate risk.</span>
                    </h2>
                    <p className="text-lg text-slate-300 font-medium leading-relaxed">
                        "The most secure way to manage enterprise contracts across your entire organization. Limitless scalability, zero compromise."
                    </p>
                </div>

                {/* Bottom Trust Indicators */}
                <div className="relative z-10 flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span>SOC2 Type II</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>ISO 27001</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>GDPR Ready</span>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-50/30">
                <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                    {/* Header */}
                    <div className="text-center lg:text-left">
                        <div className="lg:hidden mb-8">
                            <Logo className="justify-center" lightMode={true} textSize="text-xl" iconSize="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
                        <p className="mt-2 text-slate-500">Enter your credentials to access the workspace.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 animate-shake">
                                <Shield className="w-5 h-5 shrink-0" />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Work Email</label>
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    className="h-12 bg-white"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-slate-700">Password</label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:underline"
                                    >
                                        Forgot?
                                    </Link>
                                </div>
                                <Input
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="keep-signed-in"
                                checked={keepSignedIn}
                                onCheckedChange={(c: boolean | 'indeterminate') => setKeepSignedIn(!!c)}
                            />
                            <label htmlFor="keep-signed-in" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                                Keep me signed in on this device
                            </label>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full h-12 text-base bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wide shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.01]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Spinner size="sm" className="text-white border-white/30 border-t-white" />
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                "Sign In to Workspace"
                            )}
                        </Button>
                    </form>

                    {/* Demo Credentials Hint */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Demo Accounts</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => { setEmail('admin@clm.com'); setPassword('Password123!'); }} className="text-left p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs space-y-0.5 group">
                                <div className="font-bold text-slate-700 group-hover:text-orange-600">Admin</div>
                                <div className="text-slate-400 font-mono">admin@clm.com</div>
                            </button>
                            <button onClick={() => { setEmail('user@clm.com'); setPassword('Password123!'); }} className="text-left p-2 rounded-lg hover:bg-slate-50 transition-colors text-xs space-y-0.5 group">
                                <div className="font-bold text-slate-700 group-hover:text-blue-600">User</div>
                                <div className="text-slate-400 font-mono">user@clm.com</div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-8 text-center border-t border-neutral-200">
                        <p className="text-sm text-slate-500">
                            Don't have an account? <a href="#" className="font-bold text-slate-900 hover:underline">Contact Sales</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
