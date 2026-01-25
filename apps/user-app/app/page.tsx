import Link from 'next/link';
import { Button } from '@repo/ui';
import { FileText, CheckCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
            {/* Simple Header */}
            <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-neutral-900">CLM Enterprise</span>
                    </div>
                    <Link href="/login">
                        <Button variant="outline" size="sm">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
                <h1 className="text-5xl font-bold text-neutral-900 mb-4">
                    Contract Lifecycle Management
                </h1>
                <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
                    Streamline your contract lifecycle with our enterprise platform.<br />
                    Create, manage, and track contracts with ease.
                </p>

                <Link href="/login">
                    <Button size="lg" className="gap-2">
                        Access System
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Button>
                </Link>

                {/* Features */}
                <div className="mt-20">
                    <h2 className="text-2xl font-bold text-slate-900 mb-12 tracking-tight">
                        Everything you need for contract management
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        {/* Smart Templates */}
                        <div className="group cursor-pointer bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 rounded-2xl p-5 relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                                    <FileText className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                    Smart Templates
                                </h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Use legally vetted templates that can be customized for each contract while maintaining compliance.
                                </p>
                            </div>
                        </div>

                        {/* Parallel Approvals */}
                        <div className="group cursor-pointer bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 rounded-2xl p-5 relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                                    Parallel Approvals
                                </h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Speed up your contract cycle with parallel approval workflows and automatic status tracking.
                                </p>
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="group cursor-pointer bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 rounded-2xl p-5 relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                                    AI-Powered Analysis
                                </h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Get AI-powered risk analysis and recommendations while maintaining complete audit logs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="border-t border-neutral-200 mt-20">
                <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-neutral-500">
                    <p>© 2026 CLM Enterprise. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
