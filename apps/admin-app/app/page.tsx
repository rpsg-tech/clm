import { Button, Card } from '@repo/ui';
import Link from 'next/link';
import {
    Building,
    Users,
    ShieldCheck,
    LayoutTemplate,
    Zap,
    History,
    ArrowRight
} from 'lucide-react';

export default function AdminHomePage() {
    const features = [
        {
            icon: Building,
            title: "Organizations",
            description: "Manage hierarchy & settings.",
            count: "Active",
            theme: "orange"
        },
        {
            icon: Users,
            title: "User Directory",
            description: "Roles & permissions management.",
            count: "Manage",
            theme: "blue"
        },
        {
            icon: ShieldCheck,
            title: "Access Control",
            description: "Define security policies.",
            count: "Secure",
            theme: "rose"
        },
        {
            icon: LayoutTemplate,
            title: "Templates",
            description: "Global document governance.",
            count: "Library",
            theme: "violet"
        },
        {
            icon: Zap,
            title: "Feature Flags",
            description: "Toggle system capabilities.",
            count: "Config",
            theme: "amber"
        },
        {
            icon: History,
            title: "Audit Logs",
            description: "Track system activity.",
            count: "View",
            theme: "slate"
        }
    ];

    const getThemeStyles = (theme: string) => {
        const styles: any = {
            orange: "text-orange-600 group-hover:text-orange-700 bg-orange-50 group-hover:bg-orange-100",
            blue: "text-blue-600 group-hover:text-blue-700 bg-blue-50 group-hover:bg-blue-100",
            rose: "text-rose-600 group-hover:text-rose-700 bg-rose-50 group-hover:bg-rose-100",
            violet: "text-violet-600 group-hover:text-violet-700 bg-violet-50 group-hover:bg-violet-100",
            amber: "text-amber-600 group-hover:text-amber-700 bg-amber-50 group-hover:bg-amber-100",
            slate: "text-slate-600 group-hover:text-slate-700 bg-slate-50 group-hover:bg-slate-100",
        };
        return styles[theme] || styles.slate;
    };

    return (
        <main className="min-h-screen bg-[#FDFDFF] selection:bg-orange-100 selection:text-orange-900 font-sans">
            {/* Header */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-slate-900 tracking-tight">CLM</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
                            Admin
                        </span>
                    </div>
                    <Link href="/login">
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-5 h-9 shadow-md shadow-orange-600/10 border-none transition-all rounded-full">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-32">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight text-balance">
                        Admin Portal
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        System configuration & governance.
                    </p>
                </div>

                {/* Compact Designer Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, index) => (
                        <Card key={index} className="group cursor-pointer bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 rounded-2xl p-5 relative overflow-hidden">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${getThemeStyles(feature.theme)}`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wider group-hover:bg-white group-hover:shadow-sm transition-all">
                                    {feature.count}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                                        {feature.title}
                                    </h3>
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="fixed bottom-0 w-full py-6 text-center bg-white border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    CLM Enterprise © 2026
                </p>
            </footer>
        </main>
    );
}
