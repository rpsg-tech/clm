import React from 'react';
import { Input, Button } from '@repo/ui';
import { Calendar, User, FileText, DollarSign, Mail } from 'lucide-react';

interface MetadataFormPaneProps {
    values: any;
    errors: Record<string, string>;
    onChange: (field: string, value: any) => void;
}

export const MetadataFormPane: React.FC<MetadataFormPaneProps> = ({ values, errors, onChange }) => {
    return (
        <div className="h-full overflow-y-auto p-8">
            <div className="max-w-xl mx-auto space-y-8">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Contract Details</h2>
                    <p className="text-sm text-slate-500">
                        Review and verify the metadata extracted from your document.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            Contract Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. Master Services Agreement - Acme Corp"
                            value={values.title || ''}
                            onChange={(e) => onChange('title', e.target.value)}
                            className={errors.title ? "border-red-500 focus:ring-red-200" : ""}
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Counterparty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                Counterparty Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="Client / Vendor Name"
                                value={values.counterpartyName || ''}
                                onChange={(e) => onChange('counterpartyName', e.target.value)}
                                className={errors.counterpartyName ? "border-red-500 focus:ring-red-200" : ""}
                            />
                            {errors.counterpartyName && <p className="text-xs text-red-500">{errors.counterpartyName}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" />
                                Counterparty Email <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="email"
                                placeholder="contact@counterparty.com"
                                value={values.counterpartyEmail || ''}
                                onChange={(e) => onChange('counterpartyEmail', e.target.value)}
                                className={errors.counterpartyEmail ? "border-red-500 focus:ring-red-200" : ""}
                            />
                            {errors.counterpartyEmail && <p className="text-xs text-red-500">{errors.counterpartyEmail}</p>}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                Start Date
                            </label>
                            <Input
                                type="date"
                                value={values.startDate || ''}
                                onChange={(e) => onChange('startDate', e.target.value)}
                                className={errors.date ? "border-red-500" : ""}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                End Date
                            </label>
                            <Input
                                type="date"
                                value={values.endDate || ''}
                                onChange={(e) => onChange('endDate', e.target.value)}
                                className={errors.date ? "border-red-500" : ""}
                            />
                        </div>
                    </div>
                    {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}

                    {/* Amount */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            Total Value
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-8"
                                value={values.amount || ''}
                                onChange={(e) => onChange('amount', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-slate-700">Description / Notes</label>
                        <textarea
                            className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm resize-none"
                            placeholder="Add internal notes about this contract..."
                            value={values.description || ''}
                            onChange={(e) => onChange('description', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
