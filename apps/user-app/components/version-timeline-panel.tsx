import React from 'react';
import { Badge } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';

interface Version {
    id: string;
    version: number;
    createdAt: string;
    changeReason: string | null;
    changedBy: { name: string; email: string };
    type?: 'MAJOR' | 'MINOR'; // Mocked for now
}

interface VersionTimelinePanelProps {
    versions: Version[];
    selectedVersionId: string | null;
    onSelectVersion: (id: string) => void;
    currentVersionId?: string;
}

export const VersionTimelinePanel: React.FC<VersionTimelinePanelProps> = ({
    versions,
    selectedVersionId,
    onSelectVersion,
    currentVersionId
}) => {
    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Timeline ({versions.length})
                </h2>
                <div className="flex gap-2">
                    <button className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                        <MaterialIcon name="filter_list" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="relative pl-4 space-y-6">
                    {/* Vertical Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-200" />

                    {versions.map((version, index) => {
                        const isSelected = selectedVersionId === version.id;
                        const isLatest = index === 0;

                        return (
                            <div
                                key={version.id}
                                onClick={() => onSelectVersion(version.id)}
                                className={`relative group cursor-pointer transition-all duration-200 pl-8 pr-4 py-3 rounded-md border text-left ${isSelected
                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                {/* Dot on Line */}
                                <div className={`absolute left-[19px] top-6 w-4 h-4 rounded-full border-2 z-10 box-content transition-colors ${isSelected
                                        ? 'bg-indigo-600 border-white ring-2 ring-indigo-100'
                                        : isLatest ? 'bg-emerald-500 border-white' : 'bg-slate-300 border-white'
                                    }`}></div>

                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                                            v{version.version}.0
                                        </span>
                                        {isLatest && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-[9px] px-1.5 py-0 h-4">CURRENT</Badge>}
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {new Date(version.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 border border-slate-200">
                                        {version.changedBy.name.charAt(0)}
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">
                                        {version.changedBy.name}
                                    </span>
                                </div>

                                {version.changeReason ? (
                                    <div className={`text-xs p-2 rounded ${isSelected ? 'bg-white/50 text-indigo-800' : 'bg-slate-50 text-slate-600'
                                        }`}>
                                        "{version.changeReason}"
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-slate-400 italic">No notes provided</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
