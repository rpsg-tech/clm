
"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { User, Calendar, CreditCard, AlertCircle } from "lucide-react";

interface ContractMetadata {
    title: string;
    counterpartyName: string;
    counterpartyEmail: string;
    startDate?: string;
    endDate?: string;
    amount?: string;
}

interface ContractMetadataDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: ContractMetadata) => void;
    initialData?: Partial<ContractMetadata>;
    templateName?: string;
}

export function ContractMetadataDialog({
    isOpen,
    onClose,
    onConfirm,
    initialData,
    templateName
}: ContractMetadataDialogProps) {
    const [formData, setFormData] = useState<ContractMetadata>({
        title: "",
        counterpartyName: "",
        counterpartyEmail: "",
        startDate: "",
        endDate: "",
        amount: ""
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || `${templateName || 'Contract'} - ${new Date().toLocaleDateString()}`,
                counterpartyName: initialData?.counterpartyName || "",
                counterpartyEmail: initialData?.counterpartyEmail || "",
                startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
                endDate: initialData?.endDate || "",
                amount: initialData?.amount || ""
            });
            setErrors({});
        }
    }, [isOpen, initialData, templateName]);

    const handleChange = (field: keyof ContractMetadata, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error on change
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.title || formData.title.length < 3) {
            newErrors.title = "Title is required (min 3 chars)";
        }

        if (!formData.counterpartyName) {
            newErrors.counterpartyName = "Counterparty Name is required";
        }

        if (!formData.counterpartyEmail) {
            newErrors.counterpartyEmail = "Counterparty Email is required";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.counterpartyEmail)) {
                newErrors.counterpartyEmail = "Invalid email format";
            }
        }

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                newErrors.endDate = "End Date must be after Start Date";
            }
        }

        if (formData.amount && parseFloat(formData.amount) < 0) {
            newErrors.amount = "Amount cannot be negative";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onConfirm(formData);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Contract Details</DialogTitle>
                    <DialogDescription>
                        Please provide the initial details for <strong>{templateName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-bold uppercase text-slate-500">Contract Title</Label>
                        <input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-orange-500'}`}
                            placeholder="e.g. Service Agreement - Acme Corp"
                        />
                        {errors.title && <p className="text-[10px] text-red-500 font-medium flex items-center gap-1"><AlertCircle size={10} /> {errors.title}</p>}
                    </div>

                    {/* Counterparty */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 border-b border-orange-100 pb-1">
                            <User className="w-3.5 h-3.5" /> Counterparty
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cpName" className="text-[10px] font-bold uppercase text-slate-500">Name</Label>
                                <input
                                    id="cpName"
                                    value={formData.counterpartyName}
                                    onChange={(e) => handleChange("counterpartyName", e.target.value)}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${errors.counterpartyName ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-orange-500'}`}
                                    placeholder="Entity Name"
                                />
                                {errors.counterpartyName && <p className="text-[10px] text-red-500 font-medium">{errors.counterpartyName}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpEmail" className="text-[10px] font-bold uppercase text-slate-500">Email</Label>
                                <input
                                    id="cpEmail"
                                    type="email"
                                    value={formData.counterpartyEmail}
                                    onChange={(e) => handleChange("counterpartyEmail", e.target.value)}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${errors.counterpartyEmail ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-orange-500'}`}
                                    placeholder="contact@entity.com"
                                />
                                {errors.counterpartyEmail && <p className="text-[10px] text-red-500 font-medium">{errors.counterpartyEmail}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 border-b border-orange-100 pb-1">
                            <Calendar className="w-3.5 h-3.5" /> Key Terms
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate" className="text-[10px] font-bold uppercase text-slate-500">Start Date</Label>
                                <input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => handleChange("startDate", e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate" className="text-[10px] font-bold uppercase text-slate-500">End Date</Label>
                                <input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => handleChange("endDate", e.target.value)}
                                    className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 ${errors.endDate ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-orange-500'}`}
                                />
                                {errors.endDate && <p className="text-[10px] text-red-500 font-medium">{errors.endDate}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Value */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 border-b border-orange-100 pb-1">
                            <CreditCard className="w-3.5 h-3.5" /> TVC (Total Value)
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                            <input
                                id="amount"
                                type="number"
                                value={formData.amount}
                                onChange={(e) => handleChange("amount", e.target.value)}
                                className={`flex h-10 w-full rounded-md border bg-transparent pl-7 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 ${errors.amount ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-orange-500'}`}
                                placeholder="0.00"
                            />
                            {errors.amount && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.amount}</p>}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-orange-600 hover:bg-orange-500 text-white">
                        Create Draft
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
