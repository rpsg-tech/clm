"use client";

import { Button, Spinner } from "@repo/ui";
import {
    Edit, Send, Upload, CheckCircle, XCircle, ArrowRight, FileCheck, Clock, Loader2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";

interface SmartActionButtonsProps {
    contract: any;
    permissions: {
        canEdit: boolean;
        canSubmit: boolean;
        canApproveLegal: boolean; // Derived from role or permission check
        canApproveFinance: boolean;
        canSend: boolean;
    };
    loading: boolean;
    onAction: (action: string, payload?: any) => void;
}

export function SmartActionButtons({ contract, permissions, loading, onAction }: SmartActionButtonsProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onAction('upload_signed', file);
        }
    };

    // 1. Stage: DRAFT
    if (contract.status === 'DRAFT') {
        return (
            <div className="flex items-center gap-3">
                {permissions.canEdit && (
                    <Link href={`/dashboard/contracts/${contract.id}/edit`}>
                        <Button variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wide h-9 shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-2 opacity-70" />
                            Edit Draft
                        </Button>
                    </Link>
                )}
                {permissions.canSubmit && (
                    <Button
                        onClick={() => onAction('submit')}
                        disabled={loading}
                        className="bg-slate-900 hover:bg-orange-600 text-white shadow-lg font-bold text-xs uppercase tracking-wide h-9 px-6 transition-all hover:shadow-orange-500/20"
                    >
                        {loading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                        Submit for Review
                    </Button>
                )}
            </div>
        );
    }

    // 2. Stage: REVIEW (Internal Approvals)
    if (['PENDING_LEGAL', 'PENDING_FINANCE'].includes(contract.status)) {
        const isLegal = contract.status === 'PENDING_LEGAL';
        const canAct = isLegal ? permissions.canApproveLegal : permissions.canApproveFinance;
        const typeLabel = isLegal ? "Legal" : "Finance";

        if (canAct) {
            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/dashboard/approvals/legal?id=${contract.id}&action=reject`)}
                        disabled={loading}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs uppercase tracking-wide h-9 px-4"
                    >
                        Reject
                    </Button>
                    <Button
                        onClick={() => router.push(`/dashboard/approvals/legal?id=${contract.id}&action=approve`)}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg font-bold text-xs uppercase tracking-wide h-9 px-6"
                    >
                        {loading ? <Spinner size="sm" className="mr-2" /> : <CheckCircle className="w-3.5 h-3.5 mr-2" />}
                        Approve ({typeLabel})
                    </Button>
                </div>
            );
        }

        // View only for others
        return (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Waiting for {typeLabel}</span>
            </div>
        );
    }

    // 3. Stage: APPROVED (Ready to Send)
    if (contract.status === 'APPROVED') {
        return (
            <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg hidden sm:block">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1.5" />
                        Internally Approved
                    </span>
                </div>
                {permissions.canSend && (
                    <Button
                        onClick={() => onAction('send')}
                        disabled={loading}
                        className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 font-bold text-xs uppercase tracking-wide h-9 px-6 animate-pulse-subtle"
                    >
                        {loading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                        Send to Counterparty
                    </Button>
                )}
            </div>
        );
    }

    // 4. Stage: SENT (Waiting for Signature)
    if (contract.status === 'SENT_TO_COUNTERPARTY') {
        return (
            <div className="flex items-center gap-3">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                />

                <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg hidden sm:block">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide flex items-center">
                        <Clock className="w-3 h-3 mr-1.5" />
                        Awaiting Signature
                    </span>
                </div>

                <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg font-bold text-xs uppercase tracking-wide h-9 px-6"
                >
                    {loading ? <Spinner size="sm" className="mr-2" /> : <Upload className="w-3.5 h-3.5 mr-2" />}
                    Upload Signed Copy
                </Button>
            </div>
        );
    }

    // 5. Stage: ACTIVE
    if (contract.status === 'ACTIVE') {
        return (
            <div className="px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Active Contract</span>
            </div>
        );
    }

    return null;
}


