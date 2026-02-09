'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/components/auth/login-form';
import { MaterialIcon } from '@/components/ui/material-icon';

const FEATURES = [
    { icon: 'post_add', title: 'Template Creation', desc: 'Automate drafting with smart, compliant templates.' },
    { icon: 'gavel', title: 'Legal Review', desc: 'Streamline approval workflows across departments.' },
    { icon: 'psychology', title: 'AI Insights', desc: 'Data-driven risk analysis and obligation extraction.' },
    { icon: 'history', title: 'Version Control', desc: 'Track every change with precision audit trails.' },
];

function LoginContent() {
    const { isAuthenticated, isLoading, currentOrg } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.replace(currentOrg ? '/dashboard' : '/select-org');
        }
    }, [isLoading, isAuthenticated, currentOrg, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="animate-pulse text-neutral-400">Loading...</div>
            </div>
        );
    }

    if (isAuthenticated) return null;

    return (
        <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
            {/* Left: Branding panel (60%) */}
            <div className="relative hidden lg:flex w-[60%] bg-[#3730A3] flex-col justify-between p-16 overflow-hidden">
                {/* Decorative blurs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500 rounded-full blur-[80px] opacity-20 pointer-events-none" />

                {/* Logo */}
                <div className="z-10 flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                        <MaterialIcon name="contract_edit" size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white leading-none">CLM</h1>
                        <p className="text-indigo-200 text-sm font-medium leading-tight mt-0.5">Enterprise Platform</p>
                    </div>
                </div>

                {/* Main content */}
                <div className="z-10 mt-auto mb-10">
                    <h2 className="text-3xl font-bold text-white mb-12 max-w-lg leading-tight">
                        Secure Contract Lifecycle Management for Enterprise
                    </h2>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-12 max-w-3xl">
                        {FEATURES.map((f) => (
                            <div key={f.icon} className="group">
                                <div className="w-12 h-12 rounded-lg bg-indigo-500/30 flex items-center justify-center mb-4 border border-indigo-400/20 group-hover:bg-indigo-500/50 transition-colors">
                                    <MaterialIcon name={f.icon} size={24} className="text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1">{f.title}</h3>
                                <p className="text-indigo-200 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="z-10 text-indigo-300 text-xs border-t border-indigo-500/30 pt-6">
                    <span>© 2026 CLM Enterprise. All rights reserved.</span>
                </div>
            </div>

            {/* Right: Login form (40%) */}
            <div className="w-full lg:w-[40%] bg-white flex flex-col justify-center items-center px-6 py-12 lg:px-12 relative">
                {/* Mobile logo */}
                <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2 mb-8">
                    <MaterialIcon name="contract_edit" size={24} className="text-indigo-700" />
                    <div>
                        <span className="font-bold text-neutral-900 block leading-none">CLM</span>
                        <span className="text-xs text-neutral-500 font-medium">Enterprise Platform</span>
                    </div>
                </div>
                <div className="w-full max-w-[380px]">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="animate-pulse text-neutral-400">Loading...</div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
