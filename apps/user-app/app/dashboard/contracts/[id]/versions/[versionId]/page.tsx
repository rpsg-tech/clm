'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Spinner } from '@repo/ui';
import { api } from '@/lib/api-client';
import { ArrowLeft, Calendar, User, FileText, Check, X, GitCompare, GitCommit, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

function VersionDetailContent() {
    const params = useParams();
    const router = useRouter();
    const contractId = params.id as string;
    const versionId = params.versionId as string;

    const [changelog, setChangelog] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadChangelog();
    }, [contractId, versionId]);

    const loadChangelog = async () => {
        try {
            const data = await api.contracts.getVersionChangelog(contractId, versionId);
            setChangelog(data);
        } catch (err) {
            console.error('Failed to load changelog:', err);
            setError('Failed to load version details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !changelog) {
        return (
            <div className="text-center py-12">
                <p className="text-xl text-error mb-4">{error || 'Version not found'}</p>
                <Link href={`/dashboard/contracts/${contractId}`}>
                    <Button variant="outline">← Back to Contract</Button>
                </Link>
            </div>
        );
    }

    // Parse changes
    const changes = changelog.changeLog?.changes || [];
    const fieldChanges = changes.filter((c: any) => c.field && c.field !== 'content');
    const contentChange = changes.find((c: any) => c.changeType === 'content_modified' || c.field === 'content');

    // Calculate stats
    const additions = contentChange?.diffStats?.additions || contentChange?.diffSummary?.additions || 0;
    const deletions = contentChange?.diffStats?.deletions || contentChange?.diffSummary?.deletions || 0;
    const totalChanges = additions + deletions;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <Link
                    href={`/dashboard/contracts/${contractId}/versions`}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Version History
                </Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                            <GitCommit className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">
                                Version {changelog.version} Changelog
                            </h1>
                            {changelog.previousVersion && (
                                <p className="text-neutral-600 mt-1">
                                    Changes from v{changelog.previousVersion} → v{changelog.version}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Version Info Card */}
            <Card className="border-2 border-primary-100 shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <Badge variant="default" className="text-lg px-4 py-1.5 mb-2">
                                    v{changelog.version}
                                </Badge>
                                {changelog.previousVersion && (
                                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-2">
                                        <span>Upgraded from</span>
                                        <Badge variant="outline" className="font-mono">
                                            v{changelog.previousVersion}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-neutral-700 mb-2">
                                <User className="w-4 h-4" />
                                <span className="font-medium">{changelog.createdBy?.name || 'Unknown User'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-neutral-600 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>{format(new Date(changelog.createdAt), 'PPp')}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Section */}
            {changelog.changeLog?.summary && (
                <Card className="border border-neutral-200 shadow-sm">
                    <CardHeader className="bg-blue-50/50 border-b">
                        <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-neutral-700 leading-relaxed">{changelog.changeLog.summary}</p>
                    </CardContent>
                </Card>
            )}

            {/* Field Changes */}
            {fieldChanges.length > 0 && (
                <Card className="border border-neutral-200 shadow-sm">
                    <CardHeader className="bg-neutral-50/50 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Field Changes
                        </CardTitle>
                        <CardDescription>
                            {fieldChanges.length} field{fieldChanges.length !== 1 ? 's' : ''} modified
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {fieldChanges.map((change: any, index: number) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border-2 border-neutral-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant={change.changeType === 'modified' ? 'warning' : 'info'}>
                                            {change.changeType}
                                        </Badge>
                                        <span className="font-semibold text-neutral-900">
                                            {change.label || change.field}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Previous Value</p>
                                            <div className="flex items-center gap-2 p-3 rounded bg-error/10 border border-error/20 text-error">
                                                <X className="w-4 h-4 flex-shrink-0" />
                                                <span className="break-all">{String(change.oldValue || 'Empty')}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">New Value</p>
                                            <div className="flex items-center gap-2 p-3 rounded bg-success/10 border border-success/20 text-success">
                                                <Check className="w-4 h-4 flex-shrink-0" />
                                                <span className="break-all">{String(change.newValue || 'Empty')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Content Changes */}
            {contentChange && totalChanges > 0 && (
                <Card className="border border-neutral-200 shadow-sm">
                    <CardHeader className="bg-neutral-50/50 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Contract Content Changes
                        </CardTitle>
                        <CardDescription>
                            Document modifications summary
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 rounded-xl border border-neutral-200">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-medium text-neutral-900">Total Changes</span>
                                <div className="flex items-center gap-6 font-mono">
                                    <div className="flex items-center gap-2 text-success">
                                        <Check className="w-5 h-5" />
                                        <span className="text-xl font-bold">+{additions}</span>
                                        <span className="text-sm">chars</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-error">
                                        <X className="w-5 h-5" />
                                        <span className="text-xl font-bold">-{deletions}</span>
                                        <span className="text-sm">chars</span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-neutral-200 mb-4">
                                <div
                                    className="bg-success transition-all"
                                    style={{ width: `${(additions / totalChanges) * 100}%` }}
                                />
                                <div
                                    className="bg-error transition-all"
                                    style={{ width: `${(deletions / totalChanges) * 100}%` }}
                                />
                            </div>

                            <p className="text-sm text-neutral-600 text-center">
                                Use the comparison tool below to see line-by-line differences
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No Changes */}
            {fieldChanges.length === 0 && !contentChange && (
                <Card className="border border-dashed border-neutral-300">
                    <CardContent className="p-12 text-center">
                        <GitCommit className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                        <p className="text-neutral-600 mb-1">No detailed changes recorded</p>
                        <p className="text-sm text-neutral-500">This version was created but no specific changes were tracked</p>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-between items-center pt-4 border-t">
                <Link href={`/dashboard/contracts/${contractId}`}>
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Contract
                    </Button>
                </Link>
                <div className="flex gap-3">
                    {changelog.previousVersion && (
                        <Link
                            href={`/dashboard/contracts/${contractId}/compare?from=${changelog.previousVersion}&to=${changelog.version}`}
                        >
                            <Button variant="default" className="gap-2 bg-primary-600 hover:bg-primary-700">
                                <GitCompare className="w-4 h-4" />
                                Compare with v{changelog.previousVersion}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VersionDetailPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
            <VersionDetailContent />
        </Suspense>
    );
}
