'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Spinner, Badge } from '@repo/ui';
import { api } from '@/lib/api-client';
import { MaterialIcon } from '@/components/ui/material-icon';
import { DualPaneLayout } from '@/components/layout/dual-pane-layout';
import { VersionTimelinePanel } from '@/components/version-timeline-panel';
import { VersionIntelligencePanel } from '@/components/version-intelligence-panel';
import { PageErrorBoundary } from '@/components/error-boundary';

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
    status: string;
    template?: { name: string };
    content?: string;
}

function VersionHistoryContent() {
    const params = useParams();
    const router = useRouter();
    const contractId = params.id as string;

    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                // Fetch basic contract data + versions
                const [contractData, versionsData] = await Promise.all([
                    api.contracts.get(contractId),
                    api.contracts.getVersions(contractId),
                ]);
                const sortedVersions = (versionsData as ContractVersion[]).sort((a, b) => b.version - a.version);

                setContract({
                    ...(contractData as Contract),
                    versions: sortedVersions,
                });

                // Select latest version by default
                if (sortedVersions.length > 0) {
                    setSelectedVersionId(sortedVersions[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch versions:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVersions();
    }, [contractId]);

    const handleRestore = (versionId: string) => {
        if (confirm('Are you sure you want to restore this version? This will create a new version with this content.')) {
            // restoration logic (mocked)
            alert('Restoration initiated (Demo)');
        }
    };

    const handleDownload = (versionId: string) => {
        alert('Download started (Demo)');
    };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;
    }

    if (!contract) {
        return <div className="text-center py-12">Contract not found</div>;
    }

    // Header Content
    const headerContent = (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/contracts/${contractId}`)} className="rounded-md hover:bg-slate-100 text-slate-500">
                    <MaterialIcon name="arrow_back" className="w-5 h-5" />
                </Button>
                <div className="flex flex-col">
                    <h1 className="font-bold text-slate-900 text-lg leading-tight truncate max-w-[300px]">
                        Version History
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                        <span>{contract.reference}</span>
                        <span className="text-slate-300">•</span>
                        <span>{contract.title}</span>
                    </div>
                </div>
            </div>

            <Button onClick={() => router.push(`/dashboard/contracts/${contractId}`)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-wide h-9 px-5 shadow-sm">
                Return to Editor
            </Button>
        </div>
    );

    const selectedVersion = contract.versions.find(v => v.id === selectedVersionId) || null;

    // Find previous version relative to selected
    const selectedIndex = contract.versions.findIndex(v => v.id === selectedVersionId);
    // Versions are sorted desc (newest first). Previous is index + 1.
    const previousVersion = selectedIndex >= 0 && selectedIndex < contract.versions.length - 1
        ? contract.versions[selectedIndex + 1]
        : null;

    return (
        <DualPaneLayout
            header={headerContent}
            leftPane={
                <VersionTimelinePanel
                    versions={contract.versions}
                    selectedVersionId={selectedVersionId}
                    onSelectVersion={setSelectedVersionId}
                    currentVersionId={contract.versions[0]?.id}
                />
            }
            rightPane={
                <VersionIntelligencePanel
                    version={selectedVersion}
                    previousVersion={previousVersion}
                    onRestore={handleRestore}
                    onDownload={handleDownload}
                />
            }
        />
    );
}

export default function VersionHistoryPage() {
    return (
        <PageErrorBoundary>
            <Suspense fallback={<div className="flex justify-center py-12"><Spinner size="lg" /></div>}>
                <VersionHistoryContent />
            </Suspense>
        </PageErrorBoundary>
    );
}
