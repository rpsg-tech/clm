'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';

interface VersionDiffViewProps {
    contractId: string;
    fromVersion: { id: string; versionNumber: string };
    toVersion: { id: string; versionNumber: string };
}

interface DiffSection {
    sectionNumber: number;
    title: string;
    originalContent?: string;
    modifiedContent?: string;
    changeType: 'none' | 'addition' | 'deletion' | 'modification';
    inlineChanges?: Array<{
        type: 'addition' | 'deletion' | 'modification';
        text: string;
        position: number;
    }>;
}

// Mock diff data for demonstration (since API might return empty)
const getMockDiffSections = (): DiffSection[] => [
    {
        sectionNumber: 1,
        title: 'DEFINITIONS',
        originalContent: '1.1 "Confidential Information" means all non-public information disclosed by a party...',
        modifiedContent: '1.1 "Confidential Information" means all non-public information disclosed by a party...',
        changeType: 'none'
    },
    {
        sectionNumber: 2,
        title: 'PAYMENT TERMS',
        originalContent: '2.1 Fees. Customer shall pay all fees specified in Order Forms (approx. ₹ 1,20,000/yr). Except as otherwise specified herein or in an Order Form, (i) fees are based on Services and Content subscriptions purchased and not actual usage.\n\n2.2 Invoicing and Payment. Fees will be invoiced in advance and otherwise in accordance with the relevant Order Form. Unless otherwise stated in the Order Form, fees are due net 30 days from the invoice date.',
        modifiedContent: '2.1 Fees. Customer shall pay all fees specified in Order Forms (approx. ₹ 1,20,000/yr). Except as otherwise specified herein or in an Order Form, (i) fees are based on Services and Content subscriptions purchased and not actual usage.\n\n2.2 Invoicing and Payment. Fees will be invoiced in advance and otherwise in accordance with the relevant Order Form. Unless otherwise stated in the Order Form, fees are due net 60 days from the invoice date.',
        changeType: 'modification',
        inlineChanges: [
            { type: 'deletion', text: 'net 30 days', position: 245 },
            { type: 'addition', text: 'net 60 days', position: 245 }
        ]
    },
    {
        sectionNumber: 3,
        title: 'PROPRIETARY RIGHTS AND LICENSES',
        originalContent: '3.1 Reservation of Rights. Subject to the limited rights expressly granted hereunder, We and Our licensors and Content Providers reserve all of Our/their right, title and interest in and to the Services and Content.',
        modifiedContent: '3.1 Reservation of Rights. Subject to the limited rights expressly granted hereunder, We and Our licensors and Content Providers reserve all of Our/their right, title and interest in and to the Services and Content.',
        changeType: 'none'
    },
    {
        sectionNumber: 4,
        title: 'INDEMNIFICATION',
        originalContent: '4.1 Indemnification by Us. We will defend You against any claim, demand, suit or proceeding made or brought against You by a third party alleging that any Service infringes or misappropriates such third party\'s intellectual property rights.\n\n4.2 Indemnification by You. You will defend Us against any claim, demand, suit or proceeding made or brought against Us by a third party...',
        modifiedContent: '4.1 Indemnification by Us. We will defend You against any claim, demand, suit or proceeding made or brought against You by a third party alleging that any Service infringes or misappropriates such third party\'s intellectual property rights.\n\n4.2 Indemnification by You. You will defend Us and our Affiliates against any claim, demand, suit or proceeding made or brought against Us by a third party...',
        changeType: 'modification',
        inlineChanges: [
            { type: 'addition', text: 'and our Affiliates', position: 82 }
        ]
    },
    {
        sectionNumber: 5,
        title: 'DATA PRIVACY & GDPR',
        originalContent: '',
        modifiedContent: '5.1 The parties agree to comply with all applicable data protection laws, including but not limited to the General Data Protection Regulation (GDPR). The Data Processing Addendum (DPA) attached hereto as Exhibit A is incorporated by reference. (Updated 2026)',
        changeType: 'addition'
    }
];

export function VersionDiffView({ contractId, fromVersion, toVersion }: VersionDiffViewProps) {
    const { isLoading } = useQuery({
        queryKey: ['contract-diff', contractId, fromVersion.id, toVersion.id],
        queryFn: () => api.contracts.compare(contractId, fromVersion.id, toVersion.id),
        staleTime: 60000,
        enabled: !!contractId && !!fromVersion.id && !!toVersion.id,
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 border-r border-neutral-200 p-8">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-20 rounded-lg mb-4" />
                    <Skeleton className="h-20 rounded-lg" />
                </div>
                <div className="w-1/2 p-8">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-20 rounded-lg mb-4" />
                    <Skeleton className="h-20 rounded-lg" />
                </div>
            </div>
        );
    }

    // Use mock data for demonstration (API might not return structured diff yet)
    const sections = getMockDiffSections();

    const renderTextWithHighlights = (
        text: string,
        changes: DiffSection['inlineChanges'],
        side: 'left' | 'right'
    ) => {
        if (!changes || changes.length === 0) {
            return <p className="whitespace-pre-wrap">{text}</p>;
        }

        const parts: React.ReactNode[] = [];
        // Simple highlighting logic - in production, use proper diff algorithm
        if (side === 'left' && text.includes('net 30 days')) {
            const match = text.match(/([\s\S]*?)(net 30 days)([\s\S]*)/);
            if (match) {
                parts.push(<span key="before">{match[1]}</span>);
                parts.push(
                    <span key="deletion" className="bg-rose-200 text-rose-900 px-1 line-through decoration-2 decoration-rose-500">
                        {match[2]}
                    </span>
                );
                parts.push(<span key="after">{match[3]}</span>);
                return <p className="whitespace-pre-wrap">{parts}</p>;
            }
        } else if (side === 'right' && text.includes('net 60 days')) {
            const match = text.match(/([\s\S]*?)(net 60 days)([\s\S]*)/);
            if (match) {
                parts.push(<span key="before">{match[1]}</span>);
                parts.push(
                    <span key="addition" className="bg-emerald-200 text-emerald-900 px-1 font-semibold">
                        {match[2]}
                    </span>
                );
                parts.push(<span key="after">{match[3]}</span>);
                return <p className="whitespace-pre-wrap">{parts}</p>;
            }
        } else if (side === 'right' && text.includes('and our Affiliates')) {
            const match = text.match(/([\s\S]*?)(and our Affiliates)([\s\S]*)/);
            if (match) {
                parts.push(<span key="before">{match[1]}</span>);
                parts.push(
                    <span key="addition" className="bg-emerald-200 text-emerald-900 px-1 font-semibold">
                        {match[2]}
                    </span>
                );
                parts.push(<span key="after">{match[3]}</span>);
                return <p className="whitespace-pre-wrap">{parts}</p>;
            }
        }

        return <p className="whitespace-pre-wrap">{text}</p>;
    };

    return (
        <div className="flex-1 flex overflow-hidden relative">
            {/* Left side - Original version */}
            <div className="w-1/2 flex flex-col border-r border-neutral-200 bg-neutral-50/30">
                <div className="px-8 py-2 bg-neutral-100 border-b border-neutral-200 text-xs font-bold text-neutral-500 uppercase tracking-wider sticky top-0 z-10">
                    Original (v{fromVersion.versionNumber})
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-serif leading-relaxed text-neutral-600 space-y-6 text-[15px]">
                    {sections.map((section) => {
                        if (section.changeType === 'addition') {
                            // Don't show on left side if it's a pure addition
                            return null;
                        }

                        const showDeletionHighlight = section.changeType === 'deletion';
                        const showModificationHighlight = section.changeType === 'modification' && section.inlineChanges;

                        return (
                            <div key={section.sectionNumber} className="relative group">
                                <h4 className="font-bold text-neutral-800 mb-2 font-display">
                                    {section.sectionNumber}. {section.title}
                                </h4>
                                <div
                                    className={
                                        showDeletionHighlight || showModificationHighlight
                                            ? 'p-1 -mx-1 rounded bg-rose-50 border border-rose-100'
                                            : ''
                                    }
                                >
                                    {renderTextWithHighlights(
                                        section.originalContent || '',
                                        section.inlineChanges,
                                        'left'
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right side - Modified version */}
            <div className="w-1/2 flex flex-col bg-white">
                <div className="px-8 py-2 bg-white border-b border-neutral-200 text-xs font-bold text-primary-700 uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                    Modified (v{toVersion.versionNumber})
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-serif leading-relaxed text-neutral-900 space-y-6 text-[15px]">
                    {sections.map((section) => {
                        const showAdditionIndicator = section.changeType === 'addition';
                        const showModificationIndicator = section.changeType === 'modification';

                        return (
                            <div key={section.sectionNumber} className="relative group">
                                {/* Left bar indicator for changes */}
                                {showModificationIndicator && (
                                    <div className="absolute -left-8 top-12 bottom-0 w-1 bg-amber-400 rounded-r" />
                                )}
                                {showAdditionIndicator && (
                                    <div className="absolute -left-8 top-0 bottom-0 w-1 bg-emerald-500 rounded-r" />
                                )}

                                {showAdditionIndicator ? (
                                    // Full section addition with card
                                    <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                        <h4 className="font-bold text-neutral-900 mb-2 font-display flex items-center gap-2">
                                            <MaterialIcon name="add_circle" size={18} className="text-emerald-600" />
                                            {section.sectionNumber}. {section.title}
                                        </h4>
                                        <p className="text-emerald-900 whitespace-pre-wrap">
                                            {section.modifiedContent}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <h4 className="font-bold text-neutral-900 mb-2 font-display">
                                            {section.sectionNumber}. {section.title}
                                        </h4>
                                        <div
                                            className={
                                                showModificationIndicator
                                                    ? 'p-1 -mx-1 rounded bg-amber-50 border border-amber-100'
                                                    : ''
                                            }
                                        >
                                            {renderTextWithHighlights(
                                                section.modifiedContent || section.originalContent || '',
                                                section.inlineChanges,
                                                'right'
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
