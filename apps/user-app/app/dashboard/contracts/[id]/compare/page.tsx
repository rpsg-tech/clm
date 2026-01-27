'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Skeleton
} from '@repo/ui';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    ArrowRight,
    GitCompare,
    Calendar,
    User,
    Check,
    X,
    FileText,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function ComparePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const contractId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [comparing, setComparing] = useState(false);
    const [versions, setVersions] = useState<any[]>([]);
    const [comparison, setComparison] = useState<any>(null);

    // Derived versions with numbers
    const versionsWithNumbers = [...versions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((v, i, arr) => ({
            ...v,
            displayVersion: v.version || (arr.length - i)
        }));

    const [fromVersionId, setFromVersionId] = useState(searchParams.get('from') || '');
    const [toVersionId, setToVersionId] = useState(searchParams.get('to') || '');

    useEffect(() => {
        loadVersions();
    }, [contractId]);

    useEffect(() => {
        if (versions.length > 0 && fromVersionId && toVersionId) {
            runComparison();
        }
    }, [fromVersionId, toVersionId, versions]);

    const loadVersions = async () => {
        try {
            const data = await api.contracts.getVersions(contractId);
            setVersions(data);

            // Check if URL params are version numbers (not UUIDs)
            const fromParam = searchParams.get('from') || '';
            const toParam = searchParams.get('to') || '';

            // If params are numbers, convert to IDs
            if (fromParam && !fromParam.includes('-')) {
                const versionNum = parseInt(fromParam);
                const version = data.find((v: any) => v.version === versionNum);
                if (version) setFromVersionId(version.id);
            } else if (fromParam) {
                setFromVersionId(fromParam);
            }

            if (toParam && !toParam.includes('-')) {
                const versionNum = parseInt(toParam);
                const version = data.find((v: any) => v.version === versionNum);
                if (version) setToVersionId(version.id);
            } else if (toParam) {
                setToVersionId(toParam);
            }

            // Set defaults if not provided
            if (data.length >= 2 && !fromParam && !toParam) {
                setToVersionId(data[0].id); // Latest
                setFromVersionId(data[1].id); // Previous
            }
        } catch (error) {
            console.error('Failed to load versions', error);
        } finally {
            setLoading(false);
        }
    };

    const runComparison = async () => {
        if (!fromVersionId || !toVersionId) return;

        if (fromVersionId === toVersionId) {
            setComparison(null);
            return;
        }

        try {
            setComparing(true);
            const result = await api.contracts.compare(contractId, fromVersionId, toVersionId);
            setComparison(result);
        } catch (error) {
            console.error('Comparison failed', error);
        } finally {
            setComparing(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div>
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4 text-neutral-600 hover:text-neutral-900 -ml-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Contract
                </Button>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Compare Versions</h1>
                <p className="text-neutral-600">Select two versions to compare side-by-side.</p>
            </div>

            {/* Controls */}
            <Card className="border border-neutral-200 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="text-sm font-medium text-neutral-700 mb-1 block">From Version</label>
                            <Select value={fromVersionId} onValueChange={setFromVersionId}>
                                <SelectTrigger className="w-full">
                                    {/* Explicitly render selected value to avoid UUID fallback */}
                                    {versionsWithNumbers.find(v => v.id === fromVersionId) ? (
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium mr-1.5">v{versionsWithNumbers.find(v => v.id === fromVersionId)?.displayVersion}</span>
                                            <span className="text-neutral-400 truncate">
                                                - {format(new Date(versionsWithNumbers.find(v => v.id === fromVersionId)?.createdAt), 'MMM d, yyyy HH:mm')}
                                            </span>
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Select version" />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    {versionsWithNumbers.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            <span className="font-medium mr-1.5">v{v.displayVersion}</span>
                                            <span className="text-neutral-400">
                                                - {format(new Date(v.createdAt), 'MMM d, yyyy HH:mm')}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="hidden md:flex items-center justify-center pt-6">
                            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                <ArrowRight className="w-4 h-4 text-neutral-400" />
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <label className="text-sm font-medium text-neutral-700 mb-1 block">To Version</label>
                            <Select value={toVersionId} onValueChange={setToVersionId}>
                                <SelectTrigger className="w-full">
                                    {versionsWithNumbers.find(v => v.id === toVersionId) ? (
                                        <div className="flex items-center text-sm">
                                            <span className="font-medium mr-1.5">v{versionsWithNumbers.find(v => v.id === toVersionId)?.displayVersion}</span>
                                            <span className="text-neutral-400 truncate">
                                                - {format(new Date(versionsWithNumbers.find(v => v.id === toVersionId)?.createdAt), 'MMM d, yyyy HH:mm')}
                                            </span>
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Select version" />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    {versionsWithNumbers.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            <span className="font-medium mr-1.5">v{v.displayVersion}</span>
                                            <span className="text-neutral-400">
                                                - {format(new Date(v.createdAt), 'MMM d, yyyy HH:mm')}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Comparison Results */}
            {comparing ? (
                <Card className="border-dashed border-2 border-neutral-200 bg-neutral-50">
                    <CardContent className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <GitCompare className="w-6 h-6 text-primary-600" />
                        </div>
                        <p className="text-neutral-600">Calculating differences...</p>
                    </CardContent>
                </Card>
            ) : comparison ? (
                <div className="space-y-6">
                    {/* Field Changes */}
                    {comparison.fieldChanges.length > 0 && (
                        <Card className="border border-neutral-200 shadow-sm">
                            <CardHeader className="border-b bg-neutral-50/50">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-neutral-500" />
                                    Metadata Changes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-neutral-100">
                                    {comparison.fieldChanges.map((change: any, index: number) => (
                                        <div key={index} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="font-medium text-neutral-700 flex items-center gap-2">
                                                {change.label}
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {change.changeType}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-error bg-error/5 p-2 rounded border border-error/10">
                                                <X className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{String(change.oldValue || 'Empty')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-success bg-success/5 p-2 rounded border border-success/10">
                                                <Check className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{String(change.newValue || 'Empty')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Content Diff */}
                    <Card className="border border-neutral-200 shadow-sm overflow-hidden">
                        <CardHeader className="border-b bg-neutral-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-neutral-500" />
                                Contract Content Differences
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm font-mono">
                                <span className="flex items-center gap-1 text-success">
                                    <span className="text-xl font-bold">+{comparison.contentDiff?.diffStats?.additions || 0}</span>
                                    <span className="hidden sm:inline">additions</span>
                                </span>
                                <span className="flex items-center gap-1 text-error">
                                    <span className="text-xl font-bold">-{comparison.contentDiff?.diffStats?.deletions || 0}</span>
                                    <span className="hidden sm:inline">deletions</span>
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div
                                className="prose max-w-none p-8 font-mono text-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: comparison.contentDiff?.htmlDiff || '<p class="text-neutral-500 italic">No content changes detected.</p>' }}
                            />
                        </CardContent>
                    </Card>

                    <style jsx global>{`
                        .diff-content span {
                            white-space: pre-wrap;
                        }
                        .diff-added {
                            background-color: #dcfce7;
                            color: #166534;
                            text-decoration: none;
                        }
                        .diff-removed {
                            background-color: #fee2e2;
                            color: #991b1b;
                            text-decoration: line-through;
                        }
                    `}</style>
                </div>
            ) : (
                <div className="text-center py-12 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    {fromVersionId && toVersionId && fromVersionId === toVersionId ? (
                        <>
                            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6 text-neutral-400" />
                            </div>
                            <h3 className="text-lg font-medium text-neutral-900">Versisons are Identical</h3>
                            <p className="text-neutral-500">You have selected the same version for both fields.</p>
                            <p className="text-neutral-500">Please select two different versions to see changes.</p>
                        </>
                    ) : (
                        <>
                            <GitCompare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-neutral-900">Select versions to compare</h3>
                            <p className="text-neutral-500">Choose two different versions to see what changed.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
