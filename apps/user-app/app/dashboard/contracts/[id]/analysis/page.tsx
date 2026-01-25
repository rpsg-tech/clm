'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Skeleton } from '@repo/ui';
import { useToast } from '@/lib/toast-context';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    FileText,
    TrendingUp,
    Lightbulb,
    AlertCircle,
    BarChart3,
    Shield
} from 'lucide-react';

interface ContractAnalysis {
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    keyTerms: Array<{ term: string; value: string; category: string; importance: string }>;
    issues: Array<{ severity: string; title: string; description: string; recommendation: string }>;
    suggestions: string[];
    summary: string;
}

interface Contract {
    id: string;
    title: string;
    content: string;
    annexureData: string;
    status: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function ContractAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const { success, error: toastError } = useToast();
    const contractId = params.id as string;

    const [contract, setContract] = useState<Contract | null>(null);
    const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadContract();
    }, [contractId]);

    const loadContract = async () => {
        try {
            setIsLoading(true);
            const data = await api.contracts.get(contractId) as Contract;
            setContract(data);
        } catch (err) {
            console.error('Failed to load contract', err);
            toastError('Error', 'Failed to load contract');
        } finally {
            setIsLoading(false);
        }
    };

    const runAnalysis = async () => {
        if (!contract) return;

        const contractContent = contract.annexureData || contract.content || '';
        const textContent = contractContent.replace(/<[^>]*>/g, '').trim();

        if (textContent.length < 50) {
            setError('Contract content is too short for analysis. It must contain at least 50 characters of text.');
            toastError('Content Too Short', 'Contract needs more content for AI analysis (minimum 50 characters)');
            return;
        }

        try {
            setIsAnalyzing(true);
            setError(null);
            const result = await api.ai.analyze(contractContent, contract.title);
            setAnalysis(result);
            success('Analysis Complete', 'Contract has been analyzed successfully');
        } catch (err: any) {
            console.error('Analysis failed', err);
            const errorMessage = err.message || 'Could not analyze contract';
            setError(errorMessage);
            toastError('Analysis Failed', errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'MEDIUM': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-200';
            default: return 'text-neutral-600 bg-neutral-50 border-neutral-200';
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return <Badge variant="error" className="animate-pulse">Critical</Badge>;
            case 'WARNING': return <Badge variant="warning">Warning</Badge>;
            case 'INFO': return <Badge variant="info">Info</Badge>;
            default: return <Badge variant="secondary">{severity}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-8 max-w-7xl mx-auto p-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-2xl col-span-2" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-neutral-400" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Contract Not Found</h2>
                <p className="text-neutral-500 mb-8 max-w-md">The contract you're looking for doesn't exist or you don't have permission to view it.</p>
                <Button onClick={() => router.back()} variant="outline" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-6 md:p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="text-neutral-500 hover:text-neutral-900 -ml-2 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Contract
                    </Button>
                    <h1 className="text-4xl font-bold text-neutral-900 tracking-tight">AI Analysis</h1>
                    <p className="text-lg text-neutral-500">
                        Intelligent insights for <span className="font-semibold text-neutral-900">{contract.title}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                        size="lg"
                        className="bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        {isAnalyzing ? (
                            <>
                                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                Analyzing...
                            </>
                        ) : analysis ? (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Re-run Analysis
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Start Analysis
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>

            {/* Error State */}
            <AnimatePresence>
                {error && !isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="border-red-200 bg-red-50/50">
                            <CardContent className="flex items-start gap-4 p-6">
                                <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-red-900">Analysis Failed</h3>
                                    <p className="text-red-700 mt-1">{error}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Initial State */}
            {!analysis && !isAnalyzing && !error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-20 text-center bg-white rounded-3xl border border-neutral-200 border-dashed shadow-sm"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Sparkles className="w-10 h-10 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-3">AI-Powered Contract Insights</h2>
                    <p className="text-neutral-500 max-w-lg mx-auto mb-8 text-lg">
                        Leverage advanced AI to detect risks, extract key terms, and get actionable recommendations for your contract.
                    </p>
                    <Button onClick={runAnalysis} size="lg" className="px-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full">
                        Run Analysis Now
                    </Button>
                </motion.div>
            )}

            {/* Analyzing State */}
            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-24 text-center bg-white rounded-3xl border border-neutral-100 shadow-xl"
                >
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-neutral-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
                        <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary-600 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Analyzing Contract...</h2>
                    <p className="text-neutral-500">Identifying risks and extracting insights</p>
                </motion.div>
            )}

            {/* Results Dashboard */}
            {analysis && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {/* Key Metrics */}
                    <motion.div variants={itemVariants} className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className={`overflow-hidden border-l-4 ${getRiskColor(analysis.riskLevel).replace('bg-', 'border-l-')}`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Risk Score</h3>
                                    <Shield className={`w-5 h-5 ${analysis.riskLevel === 'HIGH' ? 'text-rose-500' : 'text-emerald-500'}`} />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-bold text-neutral-900">{analysis.riskScore}</span>
                                    <span className="text-sm text-neutral-400">/ 100</span>
                                </div>
                                <div className="mt-4">
                                    <Badge className={`${getRiskColor(analysis.riskLevel)} border-0 font-bold px-3 py-1`}>
                                        {analysis.riskLevel} RISK
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="group hover:border-primary-200 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Issues Found</h3>
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                </div>
                                <div className="text-5xl font-bold text-neutral-900">{analysis.issues.length}</div>
                                <p className="text-sm text-neutral-500 mt-2">Potential clauses requiring attention</p>
                            </CardContent>
                        </Card>

                        <Card className="group hover:border-primary-200 transition-colors">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Key Terms</h3>
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="text-5xl font-bold text-neutral-900">{analysis.keyTerms.length}</div>
                                <p className="text-sm text-neutral-500 mt-2">Important entities and dates extracted</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Executive Summary */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="h-full border-neutral-200 shadow-sm">
                            <CardHeader className="bg-neutral-50/50 border-b border-neutral-100">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-neutral-500" />
                                    Executive Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <p className="text-lg text-neutral-700 leading-relaxed font-light">
                                    {analysis.summary}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Suggestions Area */}
                    <motion.div variants={itemVariants} className="lg:col-span-1">
                        <Card className="h-full border-neutral-200 shadow-sm bg-gradient-to-br from-white to-neutral-50">
                            <CardHeader className="border-b border-neutral-100">
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-amber-500" />
                                    Recommendations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ul className="divide-y divide-neutral-100">
                                    {analysis.suggestions.slice(0, 4).map((suggestion, index) => (
                                        <li key={index} className="p-4 hover:bg-white transition-colors flex gap-3">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-neutral-600 text-sm font-medium">{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="p-4 pt-2">
                                    <Button variant="ghost" size="sm" className="w-full text-neutral-500 hover:text-primary-600">
                                        View All Recommendations
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Deep/Critical Issues */}
                    {analysis.issues.length > 0 && (
                        <motion.div variants={itemVariants} className="col-span-full">
                            <h2 className="text-xl font-bold text-neutral-900 mb-4 px-1 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-neutral-900" />
                                Critical Findings
                            </h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {analysis.issues.map((issue, index) => (
                                    <Card key={index} className="border-l-4 border-l-amber-400 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {getSeverityBadge(issue.severity)}
                                                        <h4 className="font-bold text-neutral-900 line-clamp-1">{issue.title}</h4>
                                                    </div>
                                                    <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                                                        {issue.description}
                                                    </p>
                                                    <div className="bg-neutral-50 rounded-lg p-3 text-sm border border-neutral-100">
                                                        <span className="font-semibold text-neutral-900 block mb-1">Recommendation:</span>
                                                        <span className="text-neutral-700">{issue.recommendation}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
