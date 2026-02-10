"use client";

import { useState, useMemo } from "react";
import { Search, Sparkles, FileText, ArrowRight, Zap, Command, ChevronRight, Upload } from "lucide-react";
import { Template } from "@repo/types";
import { Button, Badge } from "@repo/ui";

interface ContractLaunchpadProps {
    templates: Template[];
    onSelect: (template: Template) => void;
    onUpload: (file: File) => void;
    isLoading?: boolean;
}

// Smart Keywords mapping
const KEYWORD_MAPPINGS: Record<string, string> = {
    "buy": "PURCHASE_ORDER",
    "purchase": "PURCHASE_ORDER",
    "order": "PURCHASE_ORDER",
    "vendor": "VENDOR_AGREEMENT",
    "supplier": "VENDOR_AGREEMENT",
    "partner": "VENDOR_AGREEMENT",
    "nda": "NDA",
    "confidential": "NDA",
    "hire": "SERVICE_AGREEMENT",
    "freelance": "SERVICE_AGREEMENT",
    "service": "SERVICE_AGREEMENT",
    "employee": "EMPLOYMENT",
    "job": "EMPLOYMENT"
};

export function ContractLaunchpad({ templates, onSelect, onUpload, isLoading = false }: ContractLaunchpadProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showAll, setShowAll] = useState(false);

    // Global Filter: Hide internal/system templates like THIRD_PARTY
    const visibleTemplates = useMemo(() => templates.filter(t => t.code !== 'THIRD_PARTY'), [templates]);

    // Filter Logic
    const { topMatches, otherMatches } = useMemo(() => {
        if (!searchQuery.trim()) {
            return { topMatches: [], otherMatches: visibleTemplates };
        } // ... rest of logic stays same


        const lowerQ = searchQuery.toLowerCase().trim();
        let filtered = templates.filter(t => t.code !== 'THIRD_PARTY');

        // Smart Mapping
        const matchedCategories = Object.entries(KEYWORD_MAPPINGS)
            .filter(([key]) => lowerQ.includes(key))
            .map(([, category]) => category);

        // Score and Filter
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(lowerQ) ||
            t.description?.toLowerCase().includes(lowerQ) ||
            matchedCategories.includes(t.category)
        );

        // "3 time found then all template" logic
        return {
            topMatches: filtered.slice(0, 3), // Top 3 Best Matches
            otherMatches: filtered.slice(3)   // The rest
        };

    }, [templates, searchQuery]);

    const isSearching = searchQuery.trim().length > 0;

    return (
        <div className="w-full max-w-5xl mx-auto py-16 px-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">

            {/* 1. HERO HEADER */}
            <div className="text-center space-y-3 mb-12 w-full">
                <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">What would you like to draft?</h1>
                <p className="text-slate-500 text-lg">Describe your needs and let AI find the right contract.</p>
            </div>

            {/* 2. AI SEARCH INPUT */}
            <div className="relative w-full max-w-3xl group mb-16">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., I need a contract for a new freelance designer..."
                    className="w-full text-lg h-[72px] pl-16 pr-20 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 hover:border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none placeholder:text-slate-300 font-medium text-slate-700"
                    autoFocus
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                    <button
                        className="h-12 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-lg"
                        onClick={() => {/* Trigger search or AI action */ }}
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 3. QUICK START SECTION */}
            <div className="w-full max-w-5xl">
                <div className="flex items-center justify-between mb-6 px-1">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{showAll ? "All Templates" : "Quick Start"}</h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => document.getElementById('contract-launchpad-upload')?.click()}
                            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-slate-300 bg-slate-50/50 text-slate-600 text-xs font-bold uppercase tracking-wide hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
                            title="Upload existing contract (PDF/Word)"
                        >
                            <Upload className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
                            Upload Contract
                        </button>
                        <div className="h-5 w-[1px] bg-slate-200"></div>
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-xs font-bold uppercase tracking-wide text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            {showAll ? "Show Less" : "Browse All"}
                        </button>
                    </div>
                    {/* Hidden Input for Upload */}
                    <input
                        id="contract-launchpad-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.doc"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                onUpload(file);
                                // Reset value so same file can be selected again if needed
                                e.target.value = '';
                            }
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">



                    {/* C. Templates (Dynamic) */}
                    {(isSearching ? topMatches : (showAll ? visibleTemplates : visibleTemplates.slice(0, 3))).map((template) => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template)}
                            className="group flex flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-orange-300 transition-all text-left"
                        >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-orange-900 transition-colors">{template.name}</h4>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium line-clamp-1">{template.category || "General"}</p>
                            </div>
                        </button>
                    ))}

                </div>
            </div>

            {/* 4. Fallback Results for Search */}
            {isSearching && topMatches.length === 0 && (
                <div className="text-center py-12 animate-in fade-in">
                    <p className="text-slate-400">No templates found for "{searchQuery}"</p>
                </div>
            )}
        </div>
    );
}
