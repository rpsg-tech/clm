'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
    AlertTriangle,
    CheckCircle,
    ChevronRight,
    FileText,
    ShieldAlert,
    Sparkles,
    XCircle,
    Loader2
} from 'lucide-react';
import { cn } from '@repo/ui';

interface AnalysisResult {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    keyTerms: Array<{ term: string, category: string, importance: string }>;
    issues: Array<{ severity: 'CRITICAL' | 'WARNING', title: string, description: string, clause?: string }>;
    suggestions: string[];
    summary: string;
}

interface FinalChecksSidebarProps {
    contractId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function FinalChecksSidebar({ contractId, isOpen, onClose }: FinalChecksSidebarProps) {
    const [result, setResult] = useState<AnalysisResult | null>(null);

    const { mutate: runAnalysis, isPending } = useMutation({
        mutationFn: async () => {
            return await api.contracts.analyze(contractId);
        },
        onSuccess: (data) => {
            setResult(data);
        },
        onError: (error) => {
            console.error('Analysis failed', error);
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white border-l border-slate-200 shadow-2xl transform transition-transform duration-300 z-40 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    <h2 className="font-semibold text-slate-800">Final Checks</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Initial State / Trigger */}
                {!result && !isPending && (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="font-medium text-slate-800 mb-2">AI Risk Analysis</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Scan your contract for missing clauses, liability risks, and compliance issues.
                        </p>
                        <button
                            onClick={() => runAnalysis()}
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm active:scale-[0.98]"
                        >
                            Run Final Checks
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isPending && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                        <h3 className="font-medium text-slate-800">Analyzing Contract...</h3>
                        <p className="text-xs text-slate-400 mt-2">Checking annexures & compliance...</p>
                    </div>
                )}

                {/* Results */}
                {result && !isPending && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Status Card */}
                        <div className={cn(
                            "p-4 rounded-xl border flex items-start gap-4",
                            result.riskLevel === 'HIGH' ? "bg-red-50 border-red-100" :
                                result.riskLevel === 'MEDIUM' ? "bg-amber-50 border-amber-100" :
                                    "bg-green-50 border-green-100"
                        )}>
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                result.riskLevel === 'HIGH' ? "bg-red-100 text-red-600" :
                                    result.riskLevel === 'MEDIUM' ? "bg-amber-100 text-amber-600" :
                                        "bg-green-100 text-green-600"
                            )}>
                                {result.riskLevel === 'HIGH' ? <ShieldAlert size={20} /> :
                                    result.riskLevel === 'MEDIUM' ? <AlertTriangle size={20} /> :
                                        <CheckCircle size={20} />}
                            </div>
                            <div>
                                <h4 className={cn(
                                    "font-semibold text-sm",
                                    result.riskLevel === 'HIGH' ? "text-red-900" :
                                        result.riskLevel === 'MEDIUM' ? "text-amber-900" :
                                            "text-green-900"
                                )}>
                                    {result.riskLevel === 'LOW' ? 'Ready for Submission' : 'Risks Detected'}
                                </h4>
                                <p className={cn(
                                    "text-xs mt-1 leading-relaxed",
                                    result.riskLevel === 'HIGH' ? "text-red-700" :
                                        result.riskLevel === 'MEDIUM' ? "text-amber-700" :
                                            "text-green-700"
                                )}>
                                    Risk Score: {result.riskScore}/10. {result.summary}
                                </p>
                            </div>
                        </div>

                        {/* Critical Issues */}
                        {result.issues.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Critical Findings</h4>
                                <div className="space-y-3">
                                    {result.issues.map((issue, i) => (
                                        <div key={i} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-orange-200 transition-colors">
                                            <div className="flex items-center gap-2 mb-1">
                                                {issue.severity === 'CRITICAL' ? (
                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span className="font-medium text-slate-800 text-sm">{issue.title}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed pl-6">{issue.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Key Terms */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Detected Clauses</h4>
                            <div className="flex flex-wrap gap-2">
                                {result.keyTerms.map((term, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                        <FileText size={12} />
                                        {term.term}
                                    </span>
                                ))}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
