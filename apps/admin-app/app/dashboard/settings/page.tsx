'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api-client';
import { Card, Button, Badge, Spinner } from '@repo/ui';
import {
    Settings,
    ToggleLeft,
    ToggleRight,
    Zap,
    Palette,
    Shield,
    Globe,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Cpu,
    Fingerprint,
    Lock,
    Command,
    Terminal,
    ArrowRight,
    Search,
    Monitor,
    Layout
} from 'lucide-react';

export default function SettingsPage() {
    const [features, setFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.featureFlags.list().then(data => {
            setFeatures(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20 selection:bg-orange-100 relative">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Administrator / Settings</p>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Settings</h1>
                    <p className="text-slate-500 font-bold text-lg max-w-lg leading-relaxed">Configure global platform behavior and feature flags.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-full font-black text-[10px] tracking-widest uppercase">
                        Config Version 2.1.0
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-1 space-y-10">
                    <div>
                        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Navigation</p>
                        <nav className="space-y-2.5">
                            <Button variant="ghost" className="w-full justify-start text-orange-600 bg-white shadow-xl shadow-slate-200/40 font-black px-6 py-4 rounded-2xl border border-slate-100 transition-all">
                                <Zap className="w-4 h-4 mr-4" />
                                Features
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 px-6 py-4 rounded-2xl transition-all font-bold group">
                                <Monitor className="w-4 h-4 mr-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                System Health
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 px-6 py-4 rounded-2xl transition-all font-bold group">
                                <Globe className="w-4 h-4 mr-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                Regional Settings
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-xl hover:shadow-slate-200/20 px-6 py-4 rounded-2xl transition-all font-bold group">
                                <Shield className="w-4 h-4 mr-4 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                Security Policy
                            </Button>
                        </nav>
                    </div>

                    <div className="p-10 bg-slate-900 border-none rounded-[2.5rem] text-white shadow-2xl shadow-slate-900/20 overflow-hidden relative group">
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <Cpu className="w-8 h-8 mb-8 text-orange-500" />
                            <p className="text-[11px] font-black uppercase tracking-[0.3em] leading-relaxed mb-2 text-orange-200/60">
                                System Status
                            </p>
                            <h4 className="text-xl font-black leading-tight tracking-tighter">All systems operational.</h4>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <Card className="bg-white border-transparent shadow-2xl shadow-slate-200/50 rounded-[3rem] overflow-hidden p-0 ring-1 ring-slate-100/50">
                        <div className="p-12 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-orange-50 rounded-[1.75rem] border border-orange-100 shadow-sm">
                                    <Layout className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Platform Features</h2>
                                    <p className="text-slate-500 font-bold text-sm mt-1">Enable or disable core system modules.</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-32 flex flex-col items-center justify-center gap-6">
                                <Spinner size="lg" color="orange" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Configuration...</p>
                            </div>
                        ) : features.length === 0 ? (
                            <div className="p-32 text-center flex flex-col items-center gap-8">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem]">
                                    <Settings className="w-16 h-16 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Features Found</h3>
                                    <p className="text-slate-400 font-bold leading-relaxed">The configuration registry is currently empty.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {features.map((feature) => (
                                    <div key={feature.code} className="p-10 flex items-start justify-between hover:bg-slate-50/20 transition-all duration-500 group relative">
                                        <div className="flex-1 pr-16">
                                            <div className="flex items-center gap-5 mb-2">
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors tracking-tight">{feature.name}</h3>
                                                {feature.isEnabled ? (
                                                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest shadow-sm">
                                                        Enabled
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full border border-slate-200 uppercase tracking-widest">Disabled</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 leading-relaxed font-bold mb-4 group-hover:text-slate-700 transition-colors">{feature.description}</p>
                                            <div className="flex items-center gap-3">
                                                <code className="text-[10px] font-black text-slate-400 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100 tracking-widest">{feature.code}</code>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-orange-100 ${feature.isEnabled ? 'bg-orange-600' : 'bg-slate-200'}`}>
                                                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-300 ${feature.isEnabled ? 'translate-x-[26px]' : 'translate-x-[4px]'}`} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="bg-slate-50 p-6 px-12 border-t border-slate-100 flex items-center gap-4">
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Changes affect all users immediately.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
