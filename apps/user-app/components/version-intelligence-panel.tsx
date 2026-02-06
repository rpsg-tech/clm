import React, { useState } from 'react';
import { Button, Badge } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';

interface Version {
    id: string;
    version: number;
    createdAt: string;
    changeReason: string | null;
    changedBy: { name: string; email: string };
    content?: string; // Add content for diff if available
}

interface VersionIntelligencePanelProps {
    version: Version | null;
    previousVersion: Version | null;
    onRestore: (versionId: string) => void;
    onDownload: (versionId: string) => void;
}

export const VersionIntelligencePanel: React.FC<VersionIntelligencePanelProps> = ({
    version,
    previousVersion,
    onRestore,
    onDownload
}) => {
    const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CHANGES'>('SUMMARY');

    if (!version) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50/50">
                <div className="text-center p-8 opacity-50">
                    <MaterialIcon name="history" className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Select a version to analyze</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200">
            {/* Header / Actions */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/30">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-slate-900">Version {version.version}.0</h2>
                        <Badge variant="outline" className="font-mono text-[10px]">
                            {new Date(version.createdAt).toLocaleDateString()}
                        </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        Authored by <span className="text-slate-900">{version.changedBy.name}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onDownload(version.id)} className="h-8 text-xs font-bold gap-2">
                        <MaterialIcon name="download" className="w-3.5 h-3.5" />
                        Download
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onRestore(version.id)} className="h-8 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-2">
                        <MaterialIcon name="restore" className="w-3.5 h-3.5" />
                        Restore
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6 gap-6">
                <button
                    onClick={() => setActiveTab('SUMMARY')}
                    className={`h-10 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'SUMMARY' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <MaterialIcon name="summarize" className="w-4 h-4" />
                    AI Summary
                </button>
                <button
                    onClick={() => setActiveTab('CHANGES')}
                    className={`h-10 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'CHANGES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <MaterialIcon name="difference" className="w-4 h-4" />
                    Changes Detected
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-50/30">
                <div className="absolute inset-0 overflow-y-auto p-6 custom-scrollbar">

                    {activeTab === 'SUMMARY' && (
                        <div className="space-y-6 max-w-2xl">
                            {/* AI Insight Card */}
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-5 border border-indigo-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <MaterialIcon name="auto_awesome" className="w-4 h-4 text-indigo-600" />
                                    <h3 className="text-xs font-bold text-indigo-900 uppercase">Executive Summary</h3>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                    This version introduces significant changes to the <strong>Indemnification</strong> and <strong>Liability Cap</strong> clauses.
                                    {version.changeReason ? ` The author noted: "${version.changeReason}".` : " No specific reason was provided."}
                                    The document structure remains consistent with the previous version.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Metadata</h4>
                                <dl className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="p-3 bg-white border border-slate-200 rounded">
                                        <dt className="text-slate-400 mb-1">Created At</dt>
                                        <dd className="font-mono font-medium">{new Date(version.createdAt).toLocaleString()}</dd>
                                    </div>
                                    <div className="p-3 bg-white border border-slate-200 rounded">
                                        <dt className="text-slate-400 mb-1">File Size</dt>
                                        <dd className="font-mono font-medium">2.4 MB</dd>
                                    </div>
                                    <div className="col-span-2 p-3 bg-white border border-slate-200 rounded">
                                        <dt className="text-slate-400 mb-1">Change Reason Log</dt>
                                        <dd className="font-medium text-slate-700">{version.changeReason || "N/A"}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CHANGES' && (
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Comparing v{version.version} vs {previousVersion ? `v${previousVersion.version}` : 'Start'}</span>
                            </div>

                            {previousVersion ? (
                                <div className="space-y-3">
                                    {/* Mock Diff Lines */}
                                    <div className="p-3 bg-white border border-slate-200 rounded-md text-sm font-mono shadow-sm">
                                        <div className="flex gap-4 border-b border-slate-100 pb-2 mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase w-16">Clause 4.2</span>
                                            <span className="text-xs font-bold text-slate-900">Payment Terms</span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="bg-rose-50 text-rose-800 p-1 -mx-1 rounded line-through opacity-70">
                                                Payment shall be made within 60 days of invoice receipt.
                                            </p>
                                            <p className="bg-emerald-50 text-emerald-800 p-1 -mx-1 rounded">
                                                Payment shall be made within <strong>30 days</strong> of invoice receipt.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-white border border-slate-200 rounded-md text-sm font-mono shadow-sm">
                                        <div className="flex gap-4 border-b border-slate-100 pb-2 mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase w-16">Clause 9.1</span>
                                            <span className="text-xs font-bold text-slate-900">Governing Law</span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="bg-emerald-50 text-emerald-800 p-1 -mx-1 rounded">
                                                <span className="text-emerald-600 font-bold">+</span> This Agreement shall be governed by the laws of the State of Delaware.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400 italic">
                                    This is the first version. No changes to compare.
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
