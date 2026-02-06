"use client";

import { FileText, Plus, Trash2, GripVertical, ChevronRight } from "lucide-react";

export interface NavItem {
    id: string;
    title: string;
    type: 'main' | 'annexure';
}

interface ContractNavigationSidebarProps {
    items: NavItem[];
    activeId: string;
    onSelect: (id: string) => void;
    onAddAnnexure: () => void;
    onRemoveAnnexure: (id: string) => void;
    className?: string;
}

export function ContractNavigationSidebar({
    items,
    activeId,
    onSelect,
    onAddAnnexure,
    onRemoveAnnexure,
    className = ""
}: ContractNavigationSidebarProps) {
    return (
        <div className={`flex flex-col bg-slate-50 border-r border-slate-200 h-full ${className}`}>

            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                    Documents <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{items.length}</span>
                </h3>
                <button
                    onClick={onAddAnnexure}
                    className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                    title="Add New Annexure"
                >
                    <Plus size={16} />
                </button>
            </div>

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
                                    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100/50 z-10'
                                    : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'}
                            `}
                        >
                            {/* Icon / Number */}
                            <span className={`
                                flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold border transition-colors
                                ${isActive
                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                    : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300'}
                            `}>
                                {isMain ? <FileText size={14} /> : (index)}
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
                                {isMain && <p className="text-[10px] text-slate-400 font-medium truncate">Primary Contract</p>}
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
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full" />
                            )}
                        </div>
                    );
                })}

                {/* Add Button at bottom of list */}
                <button
                    onClick={onAddAnnexure}
                    className="w-full py-3 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all mt-4"
                >
                    <Plus size={14} /> Add Annexure
                </button>
            </div>
        </div>
    );
}
