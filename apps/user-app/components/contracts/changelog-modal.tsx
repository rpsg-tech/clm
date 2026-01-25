'use client';

import { useState, useEffect } from 'react';
import {
    Button,
    Badge,
    Spinner,
} from '@repo/ui';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import {
    FileText,
    Calendar,
    User,
    ArrowRight,
    Check,
    X,
    AlertCircle,
    BarChart2,
    GitCommit
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

interface ChangeLogModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    versionId: string | null;
    contractId: string;
    versions: { id: string; version: number; createdAt: string; createdBy?: { name: string } }[];
    onVersionSelect: (versionId: string) => void;
}

export function ChangeLogModal({
    open,
    onOpenChange,
    versionId,
    contractId,
    versions = [],
    onVersionSelect
}: ChangeLogModalProps) {
    const router = useRouter();
    const [changelog, setChangelog] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Sort versions by date desc (newest first)
    const sortedVersions = [...versions].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Assign derived version numbers if missing (v1 is oldest)
    // entries are [newest, ..., oldest]
    // so virtual version = length - index
    const versionsWithNumbers = sortedVersions.map((v, i) => ({
        ...v,
        displayVersion: v.version || (sortedVersions.length - i)
    }));

    const currentVersion = versionsWithNumbers.find(v => v.id === versionId);

    useEffect(() => {
        if (open && versionId && contractId) {
            loadChangelog(versionId);
        } else if (open && !versionId && versionsWithNumbers.length > 0) {
            // Auto-select latest if none selected
            onVersionSelect(versionsWithNumbers[0].id);
        }
    }, [open, versionId, contractId]);

    const loadChangelog = async (vid: string) => {
        setLoading(true);
        try {
            const data = await api.contracts.getVersionChangelog(contractId, vid);
            setChangelog({
                ...data,
                // Ensure data.version matches our derived if missing
                version: data.version || versionsWithNumbers.find(v => v.id === vid)?.displayVersion
            });
        } catch (error) {
            console.error('Failed to load changelog:', error);
            setChangelog(null);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    // Parse changes from loaded changelog
    const changes = changelog?.changeLog?.changes || [];
    const fieldChanges = changes.filter((c: any) => c.field && c.field !== 'content');
    const contentChange = changes.find((c: any) => c.changeType === 'content_modified' || c.field === 'content');

    // Calculate stats
    const additions = contentChange?.diffStats?.additions || contentChange?.diffSummary?.additions || 0;
    const deletions = contentChange?.diffStats?.deletions || contentChange?.diffSummary?.deletions || 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-white p-0 overflow-hidden gap-0 rounded-2xl shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b border-neutral-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm">
                                <GitCommit className="w-5 h-5 text-primary-600" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-bold text-neutral-900">
                                    Version History
                                </DialogTitle>
                                {currentVersion && (
                                    <DialogDescription className="flex items-center gap-2 text-neutral-500 text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(currentVersion.createdAt), 'MMM d, yyyy h:mm a')}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1.5">
                                            <User className="w-3 h-3" />
                                            {currentVersion.createdBy?.name || 'System'}
                                        </span>
                                    </DialogDescription>
                                )}
                            </div>
                        </div>

                        {/* Version Selector */}
                        <div className="min-w-[160px]">
                            <Select value={versionId || ''} onValueChange={onVersionSelect}>
                                <SelectTrigger className="h-9 text-xs bg-white border-neutral-200">
                                    {versionsWithNumbers.find(v => v.id === versionId) ? (
                                        <div className="flex items-center">
                                            <span className="font-medium mr-1.5">v{versionsWithNumbers.find(v => v.id === versionId)?.displayVersion}</span>
                                            <span className="text-neutral-400">
                                                {versionsWithNumbers.find(v => v.id === versionId)?.id === versionsWithNumbers[0].id ? '(Current)' : ''}
                                            </span>
                                        </div>
                                    ) : (
                                        <SelectValue placeholder="Select version" />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    {versionsWithNumbers.map((v) => (
                                        <SelectItem key={v.id} value={v.id} className="text-xs">
                                            <span className="font-medium mr-1.5">v{v.displayVersion}</span>
                                            <span className="text-neutral-400">
                                                {v.id === versionsWithNumbers[0].id ? '(Current)' : format(new Date(v.createdAt), 'MMM d')}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] bg-neutral-50/50">
                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                                <Spinner size="lg" className="text-primary-600" />
                                <p className="text-neutral-500 text-sm">Loading changes...</p>
                            </div>
                        ) : changelog ? (
                            <div className="space-y-6">
                                {/* Summary Card */}
                                {changelog.changeLog?.summary ? (
                                    <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-primary-500" />
                                            Summary
                                        </h4>
                                        <p className="text-neutral-600 text-sm leading-relaxed">{changelog.changeLog.summary}</p>
                                    </div>
                                ) : null}

                                {/* Field Changes */}
                                {fieldChanges.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-1">Metadata Updates</h4>
                                        <div className="grid gap-3">
                                            {fieldChanges.map((change: any, index: number) => (
                                                <div key={index} className="bg-white p-3 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold text-neutral-900 text-sm">{change.label || change.field}</span>
                                                        <Badge variant={change.changeType === 'modified' ? 'warning' : 'info'} className="text-[10px] h-5 py-0">
                                                            {change.changeType}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div className="space-y-1">
                                                            <span className="text-neutral-400 font-medium">Previous</span>
                                                            <div className="flex items-center gap-2 text-error bg-error/5 p-2 rounded-lg border border-error/10">
                                                                <X className="w-3 h-3 shrink-0" />
                                                                <span className="truncate font-mono">{String(change.oldValue || '-')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-neutral-400 font-medium">New</span>
                                                            <div className="flex items-center gap-2 text-success bg-success/5 p-2 rounded-lg border border-success/10">
                                                                <Check className="w-3 h-3 shrink-0" />
                                                                <span className="truncate font-mono">{String(change.newValue || '-')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Content Changes */}
                                {contentChange && (
                                    <div>
                                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-1">Document Changes</h4>
                                        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">

                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-neutral-100 rounded-lg">
                                                        <FileText className="w-5 h-5 text-neutral-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-neutral-900 text-sm">Contract Text Modified</div>
                                                        <div className="text-xs text-neutral-500 mt-0.5">Automated diff analysis</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm font-mono bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                                                    <span className="flex items-center gap-1.5 text-success font-semibold">
                                                        <span className="text-xs">++</span>{additions}
                                                    </span>
                                                    <span className="w-px h-3 bg-neutral-200 mx-1" />
                                                    <span className="flex items-center gap-1.5 text-error font-semibold">
                                                        <span className="text-xs">--</span>{deletions}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="relative h-2 w-full bg-neutral-100 rounded-full overflow-hidden mb-4">
                                                <div className="absolute top-0 left-0 h-full bg-success opacity-80" style={{ width: `${(additions / (additions + deletions + 1)) * 100}%` }} />
                                                <div className="absolute top-0 right-0 h-full bg-error opacity-80" style={{ width: `${(deletions / (additions + deletions + 1)) * 100}%` }} />
                                            </div>

                                            <Button
                                                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg shadow-neutral-900/10"
                                                onClick={() => {
                                                    if (changelog.previousVersion) {
                                                        router.push(`/dashboard/contracts/${contractId}/compare?from=${changelog.previousVersion}&to=${changelog.version}`);
                                                    }
                                                }}
                                                disabled={!changelog.previousVersion}
                                            >
                                                <GitCommit className="w-4 h-4 mr-2" />
                                                Compare with Previous Version
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {fieldChanges.length === 0 && !contentChange && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                            <AlertCircle className="w-8 h-8 text-neutral-400" />
                                        </div>
                                        <h3 className="text-neutral-900 font-medium mb-1">No Major Changes</h3>
                                        <p className="text-neutral-500 text-sm max-w-xs">This version snapshot is identical to the previous one in terms of tracked fields.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Error or Empty State (when versionId is present but load failed)
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
                                    <AlertCircle className="w-8 h-8 text-error" />
                                </div>
                                <h3 className="text-neutral-900 font-bold mb-2">Failed to load details</h3>
                                <p className="text-neutral-500 text-sm max-w-sm mb-6">We couldn't retrieve the changelog for this version. It might be archived or corrupted.</p>
                                <Button variant="outline" onClick={() => loadChangelog(versionId || '')}>
                                    Try Again
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-4 border-t border-neutral-100 bg-neutral-50">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-neutral-500 hover:bg-white hover:text-neutral-900">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
