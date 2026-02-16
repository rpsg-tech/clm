import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Button, Spinner } from '@repo/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowLeft,
    Search,
    ArrowRightLeft
} from 'lucide-react';
import { ContractDiffView } from './contract-diff-view';
import { formatDistanceToNow } from 'date-fns';

interface VersionDiffViewerProps {
    contractId: string;
    fromVersionId: string;
    toVersionId: string;
    versions?: { id: string; versionNumber: number; createdAt: string; createdBy?: { name?: string | null } | null }[];
    onBack: () => void;
}

export function VersionDiffViewer({ contractId, fromVersionId: initialFrom, toVersionId: initialTo, versions = [], onBack }: VersionDiffViewerProps) {
    const [fromVersionId, setFromVersionId] = useState(initialFrom);
    const [toVersionId, setToVersionId] = useState(initialTo);
    const [diffData, setDiffData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'main' | 'annexures'>('main');

    useEffect(() => {
        loadComparison();
    }, [fromVersionId, toVersionId]);

    const loadComparison = async () => {
        setLoading(true);
        try {
            const data = await api.contracts.compareVersions(contractId, fromVersionId, toVersionId);
            setDiffData(data);

            // Auto-switch to annexures if only they changed
            const mainHasChanges = (data.main?.hunks?.length || 0) > 0;
            const annexHasChanges = (data.annexures?.hunks?.length || 0) > 0;
            if (!mainHasChanges && annexHasChanges) {
                setActiveTab('annexures');
            }
        } catch (error) {
            console.error('Failed to load comparison', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSwapVersions = () => {
        setFromVersionId(toVersionId);
        setToVersionId(fromVersionId);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Spinner className="w-12 h-12" />
                <p className="text-slate-500 font-medium animate-pulse">Analyzing version differences (Pro Engine)...</p>
            </div>
        );
    }

    if (!diffData) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                <Search className="w-12 h-12 mb-3 opacity-20" />
                <p>Failed to load comparison data</p>
                <Button onClick={onBack} variant="ghost" className="mt-4">Go Back</Button>
            </div>
        );
    }

    // Adapt diffData for ContractDiffView based on active tab
    const viewData = {
        main: activeTab === 'main' ? diffData.main : diffData.annexures,
        fieldChanges: activeTab === 'main' ? diffData.fieldChanges : []
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700 h-full flex flex-col">
            {/* Premium Action Bar */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} size="sm" className="text-slate-500 hover:text-indigo-600 rounded-xl h-9 px-3">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />

                    {/* Centered Version Controls */}
                    <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/50">
                        {/* FROM Version Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Base:</span>
                            <Select value={fromVersionId} onValueChange={setFromVersionId}>
                                <SelectTrigger className="w-[140px] h-8 text-xs font-bold border-0 bg-white shadow-sm hover:bg-slate-50 focus:ring-0">
                                    <span className="truncate">
                                        {versions.find(v => v.id === fromVersionId)
                                            ? `v${versions.find(v => v.id === fromVersionId)?.versionNumber}`
                                            : 'Select'}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {versions.map(v => (
                                        <SelectItem key={v.id} value={v.id} className="text-xs">
                                            <span className="font-bold mr-2">v{v.versionNumber}</span>
                                            <span className="text-slate-400 text-[10px]">{formatDistanceToNow(new Date(v.createdAt))} ago</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={handleSwapVersions}
                        >
                            <ArrowRightLeft className="w-3 h-3" />
                        </Button>

                        {/* TO Version Dropdown */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compare:</span>
                            <Select value={toVersionId} onValueChange={setToVersionId}>
                                <SelectTrigger className="w-[140px] h-8 text-xs font-bold border-0 bg-white shadow-sm hover:bg-slate-50 focus:ring-0">
                                    <span className="truncate">
                                        {versions.find(v => v.id === toVersionId)
                                            ? `v${versions.find(v => v.id === toVersionId)?.versionNumber}`
                                            : 'Select'}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {versions.map(v => (
                                        <SelectItem key={v.id} value={v.id} className="text-xs">
                                            <span className="font-bold mr-2">v{v.versionNumber}</span>
                                            <span className="text-slate-400 text-[10px]">{formatDistanceToNow(new Date(v.createdAt))} ago</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('main')}
                        className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'main' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Agreement
                    </button>
                    <button
                        onClick={() => setActiveTab('annexures')}
                        className={`flex items-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'annexures' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Annexures
                    </button>
                </div>
            </div>

            {/* Pro Viewer Component */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
                <ContractDiffView
                    diffData={viewData}
                    oldVersionLabel={versions.find(v => v.id === fromVersionId) ? `v${versions.find(v => v.id === fromVersionId)?.versionNumber}` : 'Base'}
                    newVersionLabel={versions.find(v => v.id === toVersionId) ? `v${versions.find(v => v.id === toVersionId)?.versionNumber}` : 'Current'}
                />
            </div>
        </div>
    );
}
