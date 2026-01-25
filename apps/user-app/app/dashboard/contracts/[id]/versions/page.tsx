'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Spinner, Skeleton } from '@repo/ui';
import { api } from '@/lib/api-client';

interface ContractVersion {
    id: string;
    version: number;
    annexureData: string;
    fieldData: Record<string, unknown>;
    changedBy: { name: string; email: string };
    changeReason: string | null;
    createdAt: string;
}

interface Contract {
    id: string;
    title: string;
    reference: string;
    versions: ContractVersion[];
}

function VersionHistoryContent() {
    const params = useParams();
    const router = useRouter();
    const contractId = params.id as string;

    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVersions, setSelectedVersions] = useState<[string | null, string | null]>([null, null]);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const [contractData, versionsData] = await Promise.all([
                    api.contracts.get(contractId),
                    api.contracts.getVersions(contractId),
                ]);
                setContract({
                    ...(contractData as Contract),
                    versions: versionsData as ContractVersion[],
                });
            } catch (err) {
                console.error('Failed to fetch versions:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVersions();
    }, [contractId]);

    const toggleVersionSelect = (versionId: string) => {
        setSelectedVersions((prev) => {
            if (prev[0] === versionId) return [null, prev[1]];
            if (prev[1] === versionId) return [prev[0], null];
            if (!prev[0]) return [versionId, prev[1]];
            if (!prev[1]) return [prev[0], versionId];
            return [versionId, null];
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="text-center py-12">
                <p className="text-xl text-neutral-600">Contract not found</p>
                <Link href="/dashboard/contracts">
                    <Button variant="outline" className="mt-4">← Back to Contracts</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href={`/dashboard/contracts/${contractId}`}
                        className="text-sm text-primary-600 hover:underline"
                    >
                        ← Back to Contract
                    </Link>
                    <h1 className="text-3xl font-bold text-neutral-900 mt-2">
                        Version History
                    </h1>
                    <p className="mt-1 text-neutral-500">
                        {contract.title} ({contract.reference})
                    </p>
                </div>
                {selectedVersions[0] && selectedVersions[1] && (
                    <Link
                        href={`/dashboard/contracts/${contractId}/compare?v1=${selectedVersions[0]}&v2=${selectedVersions[1]}`}
                    >
                        <Button>Compare Selected</Button>
                    </Link>
                )}
            </div>

            {/* Selection Hint */}
            {(selectedVersions[0] || selectedVersions[1]) && (
                <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700">
                    Select {selectedVersions[0] && selectedVersions[1] ? '' : 'another'} version to compare
                    {selectedVersions[0] && <Badge className="ml-2">v{contract.versions.find(v => v.id === selectedVersions[0])?.version}</Badge>}
                    {selectedVersions[1] && <Badge className="ml-2">v{contract.versions.find(v => v.id === selectedVersions[1])?.version}</Badge>}
                </div>
            )}

            {/* Version Timeline */}
            <Card>
                <CardHeader>
                    <CardTitle>All Versions</CardTitle>
                    <CardDescription>Click on versions to select for comparison</CardDescription>
                </CardHeader>
                <CardContent>
                    {contract.versions.length === 0 ? (
                        <p className="text-neutral-500 py-8 text-center">No versions recorded yet</p>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-neutral-200" />

                            <div className="space-y-4">
                                {contract.versions.map((version, index) => {
                                    const isSelected = selectedVersions.includes(version.id);
                                    const isLatest = index === 0;

                                    return (
                                        <div
                                            key={version.id}
                                            onClick={() => toggleVersionSelect(version.id)}
                                            className={`relative flex gap-4 cursor-pointer rounded-xl p-4 transition-all ${isSelected
                                                ? 'bg-primary-50 ring-2 ring-primary-500'
                                                : 'hover:bg-neutral-50'
                                                }`}
                                        >
                                            {/* Timeline dot */}
                                            <div className="relative z-10 w-12 flex items-center justify-center">
                                                <div
                                                    className={`w-5 h-5 rounded-full ring-4 ring-white ${isLatest ? 'bg-success' : 'bg-neutral-400'
                                                        }`}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-lg">v{version.version}</span>
                                                            {isLatest && (
                                                                <Badge variant="success">Latest</Badge>
                                                            )}
                                                            {isSelected && (
                                                                <Badge variant="default">Selected</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-neutral-500 mt-1">
                                                            by <span className="font-medium">{version.changedBy?.name || 'Unknown'}</span>
                                                        </p>
                                                        {version.changeReason && (
                                                            <p className="text-sm text-neutral-600 mt-2 italic">
                                                                &quot;{version.changeReason}&quot;
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-sm text-neutral-400">
                                                        <p>{new Date(version.createdAt).toLocaleDateString()}</p>
                                                        <p>{new Date(version.createdAt).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function VersionHistoryPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
            <VersionHistoryContent />
        </Suspense>
    );
}
