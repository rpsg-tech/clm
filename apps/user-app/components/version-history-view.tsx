'use client';

import { useState, useEffect } from 'react';
import {
    History,
    ArrowRight,
    GitCommit,
    FileDiff,
    RotateCcw,
    Calendar,
    User,
    ChevronRight,
    Search,
    Eye
} from 'lucide-react';
import { Button, Badge } from '@repo/ui';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { formatDistanceToNow } from 'date-fns';

interface VersionHistoryViewProps {
    contractId: string;
    onCompare: (v1: string, v2: string) => void;
    onRestore: (versionId: string) => void;
    onPreview: (version: ContractVersion) => void;
    canRestore?: boolean;
}

interface ContractVersion {
    id: string;
    versionNumber: number;
    createdAt: string;
    createdBy: {
        name: string;
        email: string;
    };
    changeLog?: {
        summary: string;
        changes: string[];
    };
}

export function VersionHistoryView({ contractId, onCompare, onRestore, onPreview, canRestore = false }: VersionHistoryViewProps) {
    const [versions, setVersions] = useState<ContractVersion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const toast = useToast();

    useEffect(() => {
        loadVersions();
    }, [contractId]);

    const loadVersions = async () => {
        try {
            const data = await api.contracts.getVersions(contractId);
            setVersions(data);
        } catch (error) {
            console.error('Failed to load history', error);
            toast.error('Error', 'Failed to load version history');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCompare = (id: string) => {
        setSelectedForCompare(prev => {
            if (prev.includes(id)) return prev.filter(v => v !== id);
            if (prev.length >= 2) return [prev[1], id]; // Keep max 2, strict replacement
            return [...prev, id];
        });
    };

    const handleCompare = () => {
        if (selectedForCompare.length !== 2) return;
        // Sort by version number logic (implicit by ID order usually, but safer to pass as is)
        onCompare(selectedForCompare[0], selectedForCompare[1]);
    };

    if (isLoading) {
        return <div className="p-12 text-center text-slate-400">Loading history...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Version History</h3>
                    <p className="text-sm text-slate-500">Track all changes and modifications over time.</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedForCompare.length === 2 && (
                        <Button
                            onClick={handleCompare}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white animate-in fade-in slide-in-from-right-2"
                        >
                            <FileDiff className="w-4 h-4 mr-2" />
                            Compare Selected ({selectedForCompare.length})
                        </Button>
                    )}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search history..."
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Premium Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="p-4 w-12 text-center">Compare</th>
                            <th className="p-4">Version</th>
                            <th className="p-4">Modified By</th>
                            <th className="p-4">Changes</th>
                            <th className="p-4 text-right">Date</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {versions.map((version) => (
                            <tr key={version.id} className="group hover:bg-indigo-50/30 transition-colors">
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        checked={selectedForCompare.includes(version.id)}
                                        onChange={() => toggleCompare(version.id)}
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-mono text-sm font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                            v{version.versionNumber}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                                            {version.createdBy.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-slate-900">{version.createdBy.name}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {version.changeLog?.summary ? (
                                        <div className="text-sm text-slate-600 max-w-md">
                                            {version.changeLog.summary}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm italic">
                                            <GitCommit className="w-3.5 h-3.5" />
                                            Start of version history
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-sm text-slate-500">
                                        <Calendar className="w-3.5 h-3.5 opacity-50" />
                                        {formatDistanceToNow(new Date(version.createdAt))} ago
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 hover:bg-white hover:border-slate-200 hover:shadow-sm"
                                            onClick={() => onPreview(version)}
                                        >
                                            <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                                        </Button>
                                        {canRestore && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 hover:bg-white hover:border-slate-200 hover:shadow-sm"
                                                onClick={() => onRestore(version.id)}
                                            >
                                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
