"use client";

import React, { useState, useEffect } from "react";
import { Button, Textarea, Spinner, Input, Badge } from "@repo/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Send, X, Plus, Mail, User } from "lucide-react";


interface EnhancedSendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (payload: SendEmailPayload) => void;
    contract?: {
        title: string;
        reference: string;
        counterpartyEmail?: string;
        counterpartyName?: string;
        startDate?: string;
        endDate?: string;
        amount?: number;
    };
    loading?: boolean;
}

export interface SendEmailPayload {
    recipients: string[];
    cc?: string[];
    subject: string;
    body: string;
}

export function EnhancedSendDialog({
    open,
    onOpenChange,
    onConfirm,
    contract,
    loading = false
}: EnhancedSendDialogProps) {
    // Email recipients (To field)
    const [recipients, setRecipients] = useState<string[]>([]);
    const [toInput, setToInput] = useState("");

    // CC recipients
    const [showCc, setShowCc] = useState(false);
    const [cc, setCc] = useState<string[]>([]);
    const [ccInput, setCcInput] = useState("");

    // Subject and Body
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");

    // Initialize with smart defaults when dialog opens
    useEffect(() => {
        if (open && contract) {
            // Reset all fields
            const defaultRecipients = contract.counterpartyEmail
                ? [contract.counterpartyEmail]
                : [];
            setRecipients(defaultRecipients);
            setToInput("");

            setCc([]);
            setCcInput("");
            setShowCc(false);

            // Default subject
            setSubject(`Contract for Your Review: ${contract.title}`);

            // Default body with template variables replaced
            const defaultBody = generateDefaultBody(contract);
            setBody(defaultBody);
        }
    }, [open, contract]);

    const generateDefaultBody = (contract: any): string => {
        const counterpartyName = contract.counterpartyName || "Valued Partner";
        const startDate = contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "TBD";
        const endDate = contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "TBD";
        const amount = contract.amount
            ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(contract.amount)
            : "TBD";

        return `Dear ${counterpartyName},

We are pleased to share the following contract for your review and signature:

• Title: ${contract.title}
• Reference: ${contract.reference}
• Start Date: ${startDate}
• End Date: ${endDate}
• Amount: ${amount}

Please review the contract and provide your signature within 10 business days.

If you have any questions or need clarification, please don't hesitate to reach out to us.

Best regards,
RPSG Legal Team`;
    };

    // Email validation
    const isValidEmail = (email: string): boolean => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email.trim());
    };

    // Add email to recipients (To field)
    const addRecipient = () => {
        const email = toInput.trim();
        if (email && isValidEmail(email) && !recipients.includes(email)) {
            setRecipients([...recipients, email]);
            setToInput("");
        }
    };

    const removeRecipient = (email: string) => {
        setRecipients(recipients.filter(r => r !== email));
    };

    // Add email to CC
    const addCc = () => {
        const email = ccInput.trim();
        if (email && isValidEmail(email) && !cc.includes(email)) {
            setCc([...cc, email]);
            setCcInput("");
        }
    };

    const removeCc = (email: string) => {
        setCc(cc.filter(c => c !== email));
    };

    // Handle Enter key for email inputs
    const handleToKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault();
            addRecipient();
        }
    };

    const handleCcKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
            e.preventDefault();
            addCc();
        }
    };

    const handleSend = () => {
        if (recipients.length === 0 || !subject.trim() || !body.trim()) {
            return;
        }

        const payload: SendEmailPayload = {
            recipients,
            cc: cc.length > 0 ? cc : undefined,
            subject: subject.trim(),
            body: body.trim(),
        };

        onConfirm(payload);
    };

    const canSend = recipients.length > 0 && subject.trim().length > 0 && body.trim().length > 0 && !loading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800">
                        <Send className="w-5 h-5 text-indigo-600" />
                        Send Contract to Counterparty
                    </DialogTitle>
                    <DialogDescription>
                        Customize your email message before sending to the counterparty.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* To Field */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            To <span className="text-rose-500">*</span>
                        </label>

                        {/* Email Tags */}
                        {recipients.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                {recipients.map((email, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="bg-indigo-100 text-indigo-700 px-2 py-1 flex items-center gap-1"
                                    >
                                        {email}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-indigo-900"
                                            onClick={() => removeRecipient(email)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Input for adding more emails */}
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="Add recipient email (press Enter or comma)"
                                value={toInput}
                                onChange={(e) => setToInput(e.target.value)}
                                onKeyDown={handleToKeyDown}
                                onBlur={addRecipient}
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRecipient}
                                disabled={!toInput.trim() || !isValidEmail(toInput.trim())}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* CC Field (Collapsible) */}
                    {!showCc && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCc(true)}
                            className="w-fit text-xs text-slate-600"
                        >
                            + Add CC
                        </Button>
                    )}

                    {showCc && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                CC (Optional)
                            </label>

                            {/* CC Tags */}
                            {cc.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                    {cc.map((email, idx) => (
                                        <Badge
                                            key={idx}
                                            variant="secondary"
                                            className="bg-slate-100 text-slate-700 px-2 py-1 flex items-center gap-1"
                                        >
                                            {email}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-slate-900"
                                                onClick={() => removeCc(email)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="Add CC email"
                                    value={ccInput}
                                    onChange={(e) => setCcInput(e.target.value)}
                                    onKeyDown={handleCcKeyDown}
                                    onBlur={addCc}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addCc}
                                    disabled={!ccInput.trim() || !isValidEmail(ccInput.trim())}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Subject Field */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">
                            Subject <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject line"
                            className="font-medium"
                        />
                        {subject.length > 60 && (
                            <p className="text-xs text-amber-600">
                                ⚠️ Subject is {subject.length} characters (recommended: &lt;60 for better deliverability)
                            </p>
                        )}
                    </div>

                    {/* Body Field */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">
                            Message <span className="text-rose-500">*</span>
                        </label>
                        <Textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Email body"
                            className="resize-none font-sans"
                            rows={12}
                        />
                        <p className="text-xs text-slate-500 flex justify-between">
                            <span>Fully editable - customize as needed</span>
                            <span>{body.length} characters</span>
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={!canSend}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                    >
                        {loading ? (
                            <><Spinner size="sm" className="text-white mr-2" /> Sending...</>
                        ) : (
                            <><Send className="w-4 h-4 mr-2" /> Send Email</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
