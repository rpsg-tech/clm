"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { CheckCircle2, AlertCircle, ChevronRight, FileText, Eye } from "lucide-react";
import { Button } from "@repo/ui";
import { VariableField, applyVariables, countFilled } from "@/lib/variable-utils";

interface VariableFillStepProps {
    variables: VariableField[];
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
    previewContent: string;           // Main contract HTML
    annexures?: { id: string; title: string; content: string }[]; // Annexure content
    templateName?: string;
    onNext: () => void;
    onBack: () => void;
}

export function VariableFillStep({
    variables,
    values,
    onChange,
    previewContent,
    annexures = [],
    templateName,
    onNext,
    onBack,
}: VariableFillStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [activeGroup, setActiveGroup] = useState<string | null>(null);

    // Refs for each group section (for auto-scroll)
    const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const formScrollRef = useRef<HTMLDivElement | null>(null);
    const previewScrollRef = useRef<HTMLDivElement | null>(null);

    // Group variables by source label
    const grouped = useMemo(() => {
        const groups: Record<string, VariableField[]> = {};
        for (const v of variables) {
            const key = v.sourceLabel;
            if (!groups[key]) groups[key] = [];
            groups[key].push(v);
        }
        return groups;
    }, [variables]);

    const groupKeys = Object.keys(grouped);

    // Map sourceLabel → preview anchor id
    const groupToAnchor = useMemo(() => {
        const map: Record<string, string> = {};
        if (groupKeys.length > 0) map[groupKeys[0]] = 'preview-section-main';
        annexures.forEach((a) => {
            map[a.title] = `preview-section-${a.id}`;
        });
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groupKeys, annexures]);

    const filled = countFilled(variables, values);
    const total = variables.length;
    const allFilled = filled === total;
    const progress = total > 0 ? Math.round((filled / total) * 100) : 100;

    // Combined preview: main content + all annexures, each section has an id anchor
    const renderedPreview = useMemo(() => {
        let html = `<div id="preview-section-main">${applyVariables(previewContent, values, { highlight: true })}</div>`;

        if (annexures.length > 0) {
            html += `<hr style="margin: 2rem 0; border-color: #e2e8f0;" />`;
            html += `<h2 style="text-align:center; text-transform:uppercase; font-size:0.85rem; letter-spacing:0.1em; color:#64748b; margin-bottom:1.5rem;">Annexures</h2>`;
            annexures.forEach((annexure, i) => {
                if (i > 0) html += `<hr style="margin: 1.5rem 0; border-color: #f1f5f9;" />`;
                html += `<div id="preview-section-${annexure.id}">`;
                html += `<h3 style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#94a3b8; margin-bottom:0.75rem;">${annexure.title}</h3>`;
                html += applyVariables(annexure.content, values, { highlight: true });
                html += `</div>`;
            });
        }
        return html;
    }, [previewContent, annexures, values]);

    // Auto-scroll BOTH panels when activeGroup changes
    useEffect(() => {
        if (!activeGroup) return;

        // Scroll form panel
        const formEl = groupRefs.current[activeGroup];
        const formContainer = formScrollRef.current;
        if (formEl && formContainer) {
            formContainer.scrollTo({ top: formEl.offsetTop - 16, behavior: "smooth" });
        }

        // Scroll preview panel to matching anchor
        const anchorId = groupToAnchor[activeGroup];
        const previewContainer = previewScrollRef.current;
        if (anchorId && previewContainer) {
            const anchor = previewContainer.querySelector(`#${anchorId}`) as HTMLElement | null;
            if (anchor) {
                previewContainer.scrollTo({ top: anchor.offsetTop - 24, behavior: "smooth" });
            }
        }
    }, [activeGroup, groupToAnchor]);

    const handleChange = useCallback((key: string, value: string, groupLabel: string) => {
        onChange({ ...values, [key]: value });
        setTouched(prev => ({ ...prev, [key]: true }));
        setActiveGroup(groupLabel);
        if (errors[key]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }, [values, onChange, errors]);

    const handleFocus = useCallback((groupLabel: string) => {
        setActiveGroup(groupLabel);
    }, []);

    const handleBlur = useCallback((field: VariableField) => {
        setTouched(prev => ({ ...prev, [field.key]: true }));
        if (field.required && (!values[field.key] || !values[field.key].trim())) {
            setErrors(prev => ({ ...prev, [field.key]: `${field.label} is required` }));
        }
    }, [values]);

    const handleNext = () => {
        const allTouched: Record<string, boolean> = {};
        const newErrors: Record<string, string> = {};
        for (const v of variables) {
            allTouched[v.key] = true;
            if (v.required && (!values[v.key] || !values[v.key].trim())) {
                newErrors[v.key] = `${v.label} is required`;
            }
        }
        setTouched(allTouched);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            // Scroll to first error group
            const firstErrorKey = Object.keys(newErrors)[0];
            const firstErrorField = variables.find(v => v.key === firstErrorKey);
            if (firstErrorField) {
                setActiveGroup(firstErrorField.sourceLabel);
            }
            return;
        }
        onNext();
    };

    if (variables.length === 0) return null;

    return (
        <div className="flex flex-1 min-h-0 w-full border border-slate-200 rounded-2xl overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-300">
            {/* ── Left Panel: Variable Form ── */}
            <div className="flex flex-col w-full md:w-[420px] lg:w-[460px] border-r border-slate-100 flex-shrink-0">
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50 flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">3</span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-900">Fill Variables</h2>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${allFilled ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {filled}/{total} filled
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                        Fill placeholders for <strong>{templateName}</strong>. Preview updates live →
                    </p>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Group jump pills */}
                    {groupKeys.length > 1 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {groupKeys.map(label => {
                                const groupFilled = grouped[label].filter(f => values[f.key]?.trim()).length;
                                const groupTotal = grouped[label].length;
                                const isActive = activeGroup === label;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => setActiveGroup(label)}
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${isActive
                                            ? 'bg-orange-600 text-white border-orange-600'
                                            : groupFilled === groupTotal
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300'
                                            }`}
                                    >
                                        {label} {groupFilled}/{groupTotal}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Scrollable Form */}
                <div ref={formScrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                    {groupKeys.map((groupLabel) => {
                        const fields = grouped[groupLabel];
                        const isActive = activeGroup === groupLabel;
                        return (
                            <div
                                key={groupLabel}
                                ref={el => { groupRefs.current[groupLabel] = el; }}
                                className={`rounded-xl border transition-all duration-200 ${isActive ? 'border-orange-200 shadow-sm shadow-orange-50' : 'border-transparent'
                                    }`}
                            >
                                {/* Group header */}
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-t-xl ${isActive ? 'bg-orange-50' : 'bg-slate-50'}`}>
                                    <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-orange-600' : 'text-slate-400'}`}>
                                        {groupLabel}
                                    </span>
                                    <div className="flex-1 h-px bg-current opacity-20" />
                                    <span className="text-[10px] text-slate-400">
                                        {fields.filter(f => values[f.key]?.trim()).length}/{fields.length}
                                    </span>
                                </div>

                                {/* Fields */}
                                <div className="px-3 py-3 space-y-4">
                                    {fields.map((field) => {
                                        const hasError = touched[field.key] && errors[field.key];
                                        const isFilled = values[field.key] && values[field.key].trim();
                                        return (
                                            <div key={field.key} className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                                                        {field.label}
                                                        {field.required && <span className="text-orange-500">*</span>}
                                                    </label>
                                                    {isFilled && !hasError && (
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                    )}
                                                </div>
                                                {field.type === 'textarea' ? (
                                                    <textarea
                                                        value={values[field.key] || ''}
                                                        onChange={e => handleChange(field.key, e.target.value, groupLabel)}
                                                        onFocus={() => handleFocus(groupLabel)}
                                                        onBlur={() => handleBlur(field)}
                                                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                                        rows={3}
                                                        className={`w-full rounded-lg border px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError ? 'border-red-300 focus:ring-red-400 bg-red-50'
                                                            : isFilled ? 'border-green-300 focus:ring-green-400 bg-green-50/30'
                                                                : 'border-slate-200 focus:ring-orange-400 bg-white'
                                                            }`}
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                        value={values[field.key] || ''}
                                                        onChange={e => handleChange(field.key, e.target.value, groupLabel)}
                                                        onFocus={() => handleFocus(groupLabel)}
                                                        onBlur={() => handleBlur(field)}
                                                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                                        className={`w-full h-9 rounded-lg border px-3 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${hasError ? 'border-red-300 focus:ring-red-400 bg-red-50'
                                                            : isFilled ? 'border-green-300 focus:ring-green-400 bg-green-50/30'
                                                                : 'border-slate-200 focus:ring-orange-400 bg-white'
                                                            }`}
                                                    />
                                                )}
                                                {hasError && (
                                                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        {errors[field.key]}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
                    <Button variant="outline" onClick={onBack} className="text-sm">
                        ← Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="flex-1 text-sm font-semibold flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white"
                    >
                        Continue to Review
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* ── Right Panel: Live Preview ── */}
            <div className="hidden md:flex flex-col flex-1 min-w-0 bg-slate-50">
                <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-600">Live Preview</span>
                        <span className="text-[10px] text-slate-400">— main contract + annexures</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-[10px] text-slate-400">
                            {total - filled} placeholder{total - filled !== 1 ? 's' : ''} remaining
                        </span>
                    </div>
                </div>
                <div ref={previewScrollRef} className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-[700px] mx-auto bg-white rounded-xl shadow-sm border border-slate-100 p-8 md:p-10">
                        <style>{`
                            .template-var-filled {
                                background: #DCFCE7;
                                color: #166534;
                                padding: 0 3px;
                                border-radius: 3px;
                                font-weight: 500;
                            }
                            .template-var-empty {
                                background: #FEF3C7;
                                color: #92400E;
                                padding: 0 4px;
                                border-radius: 3px;
                                border: 1px dashed #F59E0B;
                                font-style: italic;
                                animation: var-pulse 2s ease-in-out infinite;
                            }
                            @keyframes var-pulse {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.55; }
                            }
                        `}</style>
                        <div
                            className="prose prose-sm max-w-none text-slate-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderedPreview }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
