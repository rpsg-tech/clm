
import { FileText, CheckCircle } from "lucide-react";
import { Template } from "@repo/types";

interface TemplateSelectionViewProps {
    onSelect: (template: Template) => void;
    selectedTemplateId?: string;
    templates: Template[];
}

export function TemplateSelectionView({ onSelect, selectedTemplateId, templates }: TemplateSelectionViewProps) {
    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Select a Contract Template</h2>
                <p className="text-slate-500">Choose the legal framework for your new contract.</p>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No Templates Found</h3>
                    <p className="text-slate-500 mt-1">Please contact your admin to create templates.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => {
                        const isSelected = selectedTemplateId === template.id;
                        return (
                            <button
                                key={template.id}
                                onClick={() => onSelect(template)}
                                className={`relative p-6 rounded-3xl border-2 text-left transition-all duration-300 group hover:shadow-xl hover:-translate-y-1 ${isSelected
                                    ? "border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10 shadow-lg shadow-orange-100"
                                    : "border-slate-100 bg-white hover:border-orange-200 hover:bg-orange-50/10"
                                    }`}
                            >
                                {isSelected && (
                                    <div className="absolute top-4 right-4 text-orange-600 animate-in zoom-in duration-300">
                                        <CheckCircle size={28} className="fill-orange-100" />
                                    </div>
                                )}

                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${isSelected
                                    ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                                    : "bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 group-hover:scale-110"
                                    }`}>
                                    <FileText size={26} />
                                </div>

                                <h3 className={`font-bold text-lg mb-2 transition-colors ${isSelected ? "text-orange-900" : "text-slate-900 group-hover:text-slate-900"}`}>
                                    {template.name}
                                </h3>

                                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-600 line-clamp-2">
                                    {template.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
