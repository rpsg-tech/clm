'use client';

import { Input, Textarea } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';

export interface ContractSetup {
    title: string;
    counterpartyName: string;
    counterpartyEmail: string;
    counterpartyAddress: string;
    startDate: string;
    endDate: string;
    description: string;
    amount: string;
    paymentTerms: string;
}

const PAYMENT_OPTIONS = [
    { label: 'Net 30 (Standard)', value: 'NET_30' },
    { label: 'Net 45', value: 'NET_45' },
    { label: 'Net 60', value: 'NET_60' },
    { label: 'Net 90', value: 'NET_90' },
    { label: 'Due on Receipt', value: 'DUE_ON_RECEIPT' },
    { label: 'Custom', value: 'CUSTOM' },
];

interface SetupStepProps {
    data: ContractSetup;
    onChange: (data: ContractSetup) => void;
    templateName: string;
}

export function SetupStep({ data, onChange, templateName }: SetupStepProps) {
    function update(field: keyof ContractSetup, value: string) {
        onChange({ ...data, [field]: value });
    }

    const amountValue = Number.parseFloat(data.amount);
    const isHighValue = Number.isFinite(amountValue) && amountValue > 50000;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-neutral-900">Contract Details</h2>
                <p className="mt-1 text-sm text-neutral-500">
                    Basic information about the agreement using &ldquo;{templateName}&rdquo; template.
                </p>
            </div>

            <div className="space-y-4">
                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                        Contract Title <span className="text-red-500">*</span>
                    </span>
                    <Input
                        placeholder="e.g., MSA - Acme Corp Q2 2026"
                        value={data.title}
                        onChange={(e) => update('title', e.target.value)}
                        required
                        className="h-11"
                    />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                            Counterparty Name <span className="text-red-500">*</span>
                        </span>
                        <Input
                            placeholder="Company or individual name"
                            value={data.counterpartyName}
                            onChange={(e) => update('counterpartyName', e.target.value)}
                            required
                            className="h-11"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                            Counterparty Email
                        </span>
                        <Input
                            type="email"
                            placeholder="contact@counterparty.com"
                            value={data.counterpartyEmail}
                            onChange={(e) => update('counterpartyEmail', e.target.value)}
                            className="h-11"
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                        Counterparty Address
                    </span>
                    <Textarea
                        placeholder="Registered office address"
                        value={data.counterpartyAddress}
                        onChange={(e) => update('counterpartyAddress', e.target.value)}
                        rows={2}
                    />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                            Start Date
                        </span>
                        <Input
                            type="date"
                            value={data.startDate}
                            onChange={(e) => update('startDate', e.target.value)}
                            className="h-11"
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                            Expiry Date
                        </span>
                        <Input
                            type="date"
                            value={data.endDate}
                            onChange={(e) => update('endDate', e.target.value)}
                            className="h-11"
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                        Description
                    </span>
                    <Textarea
                        placeholder="Brief description of the contract purpose..."
                        value={data.description}
                        onChange={(e) => update('description', e.target.value)}
                        rows={3}
                    />
                </label>
            </div>

            <div className="h-px bg-neutral-200" />

            <div>
                <h2 className="text-xl font-bold text-neutral-900">Commercial Terms</h2>
                <p className="mt-1 text-sm text-neutral-500">
                    Define the financial structure of the agreement.
                </p>
            </div>

            <div className="space-y-5">
                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                        What is the total value of this deal?
                    </span>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                            $
                        </span>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={data.amount}
                            onChange={(e) => update('amount', e.target.value)}
                            className="h-12 pl-8 pr-16 text-lg"
                            min="0"
                            step="0.01"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                            USD
                        </span>
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-400">
                        Total contract value over the full term duration.
                    </p>
                </label>

                <label className="block">
                    <span className="text-sm font-medium text-neutral-700 mb-1.5 block">
                        When is payment due?
                    </span>
                    <div className="relative">
                        <MaterialIcon
                            name="calendar_today"
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <select
                            value={data.paymentTerms}
                            onChange={(e) => update('paymentTerms', e.target.value)}
                            className="w-full h-12 pl-10 pr-4 rounded-md border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-700/20 focus:border-primary-700 appearance-none"
                        >
                            <option value="">Select payment terms...</option>
                            {PAYMENT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <MaterialIcon
                            name="expand_more"
                            size={20}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                        />
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-400">
                        The number of days the client has to pay the invoice.
                    </p>
                </label>
            </div>

            <div className="rounded-lg bg-violet-50 border border-violet-200 p-4 flex items-start gap-3">
                <div className="size-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <MaterialIcon name="auto_awesome" size={18} className="text-violet-700" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium text-violet-800">AI Assistant Working</p>
                    <p className="text-xs text-violet-600 mt-0.5">
                        Drafting clauses based on template and contract value...
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
                    <MaterialIcon name="info" size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-blue-800">Why ask for value?</p>
                        <p className="text-xs text-blue-600 mt-0.5">
                            The contract value helps apply the right approval path and clause recommendations.
                        </p>
                    </div>
                </div>
                <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 flex items-start gap-3">
                    <MaterialIcon name="gavel" size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-violet-800">Legal Approval</p>
                        <p className="text-xs text-violet-600 mt-0.5">
                            {isHighValue
                                ? 'High-value contracts require expanded legal review.'
                                : 'Standard terms are pre-approved. Custom terms may require VP approval.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
