"use client";

import { FileText, Plus, Trash2, Lock, FileEdit, CheckCircle2, Circle } from "lucide-react";

export interface NavItem {
    id: string;
    title: string;
    type: 'main' | 'annexure';
}

interface ContractNavigationSidebarProps {
    items: NavItem[];
    activeId: string;
    visitedIds: Set<string>;
    onSelect: (id: string) => void;
    onAddAnnexure: () => void;
    onRemoveAnnexure: (id: string) => void;
    className?: string;
}

export function ContractNavigationSidebar({
    items,
    activeId,
    visitedIds,
    onSelect,
    onAddAnnexure,
    onRemoveAnnexure,
    className = ""
}: ContractNavigationSidebarProps) {
    // Calculate progress (exclude main from count)
    const annexureItems = items.filter(item => item.type === 'annexure');
    const visitedCount = annexureItems.filter(item => visitedIds.has(item.id)).length;
    const totalCount = annexureItems.length;
    return (
        <div className={`flex flex-col bg-slate-50 border-r border-slate-200 h-full ${className}`}>

            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    Documents <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{items.length}</span>
                </h3>
                <button
                    onClick={onAddAnnexure}
                    className="p-1.5 hover:bg-orange-50 text-slate-400 hover:text-orange-600 rounded-lg transition-colors"
                    title="Add New Annexure"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Progress Indicator (Top) */}
            {totalCount > 0 && (
                <div className="px-4 py-3 bg-white border-b border-slate-200">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Review Progress
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
                                style={{ width: `${totalCount > 0 ? (visitedCount / totalCount) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-700 tabular-nums min-w-[2.5rem] text-right">
                            {visitedCount}/{totalCount}
                        </span>
                    </div>
                    {visitedCount < totalCount && (
                        <p className="text-[10px] text-amber-600 mt-2 font-medium">
                            Review all annexures to proceed
                        </p>
                    )}
                </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {items.map((item, index) => {
                    const isActive = activeId === item.id;
                    const isMain = item.type === 'main';

                    return (
                        <div
                            key={item.id}
                            onClick={() => onSelect(item.id)}
                            className={`
                                group flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all duration-200 relative
                                ${isActive
                                    ? 'bg-white border-orange-200 shadow-sm ring-1 ring-orange-100/50 z-10'
                                    : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'}
                            `}
                        >
                            {/* Visit Status Indicator */}
                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                {isMain || visitedIds.has(item.id) ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Circle className="w-4 h-4 text-slate-300" />
                                )}
                            </div>

                            {/* Icon / Number */}
                            <span className={`
                                flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold border transition-colors
                                ${isActive
                                    ? 'bg-orange-50 border-orange-100 text-orange-700'
                                    : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}
                            `}>
                                {isMain ? <Lock size={14} className="text-slate-400" /> : <FileEdit size={14} />}
                                {/* Note: index is 0 for Main, so Annexures start at 1 if we subtract or handle separately. 
                                   Actually, if Main is always first, index 0 is main.
                                   So Annexures are index. 
                                */}
                            </span>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                                    {item.title}
                                </h4>
                                {isMain && <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1"><Lock size={10} /> Read-Only</p>}
                            </div>

                            {/* Actions (Only for Annexures) */}
                            {!isMain && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveAnnexure(item.id);
                                    }}
                                    className={`
                                        opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all
                                        ${isActive ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}
                                    `}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}

                            {/* Active Indicator Arrow */}
                            {isActive && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-l-full" />
                            )}
                        </div>
                    );
                })}

                {/* Add Button at bottom of list */}
                <button
                    onClick={onAddAnnexure}
                    className="w-full py-3 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50/50 transition-all mt-4"
                >
                    <Plus size={14} /> Add Annexure
                </button>
            </div>

        </div>
    );
}
