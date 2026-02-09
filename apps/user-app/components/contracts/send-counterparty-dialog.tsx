'use client';

import { useState, useCallback, useEffect, type KeyboardEvent, useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';
import { MaterialIcon } from '@/components/ui/material-icon';

interface SendCounterpartyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    contractId: string;
    counterpartyName: string | null;
    counterpartyEmail: string | null;
}

const mockAttachments = [
    { name: 'MSA_v2_Final.pdf', size: '2.4 MB', type: 'pdf' as const },
    { name: 'Order_Form_Q3.docx', size: '845 KB', type: 'docx' as const },
];

const toolbarIcons = [
    'format_bold',
    'format_italic',
    'format_underlined',
    'format_list_bulleted',
    'link',
] as const;

function getDefaultMessage(name: string | null): string {
    const firstName = name ? name.split(' ')[0] : 'there';
    return `Hi ${firstName},\nPlease review and sign the attached Master Services Agreement. Let us know if you have any questions regarding the terms.\nBest regards,\nLegal Team`;
}

function getDefaultSubject(name: string | null): string {
    const title = name ? `Agreement with ${name}` : 'Master Services Agreement';
    return `Action Required: ${title} for Review`;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function SendCounterpartyDialog({
    isOpen,
    onClose,
    contractId,
    counterpartyName,
    counterpartyEmail,
}: SendCounterpartyDialogProps) {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [isSending, setIsSending] = useState(false);

    // Email form state
    const [toEmails, setToEmails] = useState<string[]>([]);
    const [toInput, setToInput] = useState('');
    const [ccEmails, setCcEmails] = useState<string[]>([]);
    const [ccInput, setCcInput] = useState('');
    const [subject, setSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');

    // Preview state
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

    const headingId = useId();

    const handleClose = useCallback(() => {
        if (isSending) return;
        onClose();
    }, [isSending, onClose]);

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    // Initialize form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setToEmails(counterpartyEmail ? [counterpartyEmail] : []);
            setToInput('');
            setCcEmails([]);
            setCcInput('');
            setSubject(getDefaultSubject(counterpartyName));
            setMessageBody(getDefaultMessage(counterpartyName));
            setPreviewMode('desktop');
            setIsSending(false);
        }
    }, [isOpen, counterpartyEmail, counterpartyName]);

    const addToEmail = useCallback((raw: string) => {
        const email = raw.trim().replace(/,$/, '');
        if (email && isValidEmail(email)) {
            setToEmails((prev) => (prev.includes(email) ? prev : [...prev, email]));
            setToInput('');
        }
    }, []);

    const addCcEmail = useCallback((raw: string) => {
        const email = raw.trim().replace(/,$/, '');
        if (email && isValidEmail(email)) {
            setCcEmails((prev) => (prev.includes(email) ? prev : [...prev, email]));
            setCcInput('');
        }
    }, []);

    const handleToKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addToEmail(toInput);
            }
            if (e.key === 'Backspace' && toInput === '' && toEmails.length > 0) {
                setToEmails((prev) => prev.slice(0, -1));
            }
        },
        [toInput, toEmails.length, addToEmail],
    );

    const handleCcKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addCcEmail(ccInput);
            }
            if (e.key === 'Backspace' && ccInput === '' && ccEmails.length > 0) {
                setCcEmails((prev) => prev.slice(0, -1));
            }
        },
        [ccInput, ccEmails.length, addCcEmail],
    );

    const handleSend = useCallback(async () => {
        if (toEmails.length === 0) return;

        setIsSending(true);
        try {
            await api.contracts.send(contractId);
            queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
            queryClient.invalidateQueries({ queryKey: ['contracts'] });
            success('Contract Sent', 'The contract has been sent to the counterparty.');
            onClose();
        } catch (err) {
            showError(
                'Send Failed',
                err instanceof Error ? err.message : 'Could not send contract',
            );
        } finally {
            setIsSending(false);
        }
    }, [toEmails.length, contractId, queryClient, success, showError, onClose]);

    if (!isOpen) return null;

    const senderName = 'Legal Team';
    const orgName = 'Acme Corp';
    const firstName = counterpartyName ? counterpartyName.split(' ')[0] : 'there';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div role="dialog" aria-modal="true" aria-labelledby={headingId} className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-9 rounded-lg bg-indigo-50">
                            <MaterialIcon name="send" size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 id={headingId} className="text-lg font-bold text-neutral-900">
                                Send Agreement to Counterparty
                            </h2>
                            <p className="text-sm text-neutral-500">
                                Review details and preview email before sending
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSending}
                        aria-label="Close dialog"
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <MaterialIcon name="close" size={20} />
                    </button>
                </div>

                {/* Body — Split layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT PANE — Compose */}
                    <div className="w-[55%] border-r border-neutral-200 flex flex-col overflow-y-auto p-6 space-y-5">
                        {/* To field */}
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                                To
                            </label>
                            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border border-neutral-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500">
                                {toEmails.map((email) => (
                                    <span
                                        key={email}
                                        className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 text-sm px-2.5 py-1 rounded-md"
                                    >
                                        {email}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setToEmails((prev) =>
                                                    prev.filter((e) => e !== email),
                                                )
                                            }
                                            aria-label={`Remove ${email}`}
                                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="email"
                                    value={toInput}
                                    onChange={(e) => setToInput(e.target.value)}
                                    onKeyDown={handleToKeyDown}
                                    onBlur={() => {
                                        if (toInput.trim()) addToEmail(toInput);
                                    }}
                                    placeholder={
                                        toEmails.length === 0 ? 'Add recipients...' : ''
                                    }
                                    className="flex-1 min-w-[120px] text-sm outline-none placeholder:text-neutral-400 bg-transparent"
                                    disabled={isSending}
                                />
                            </div>
                        </div>

                        {/* Cc field */}
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                                Cc
                            </label>
                            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border border-neutral-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500">
                                {ccEmails.map((email) => (
                                    <span
                                        key={email}
                                        className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 text-sm px-2.5 py-1 rounded-md"
                                    >
                                        {email}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setCcEmails((prev) =>
                                                    prev.filter((e) => e !== email),
                                                )
                                            }
                                            aria-label={`Remove ${email}`}
                                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="email"
                                    value={ccInput}
                                    onChange={(e) => setCcInput(e.target.value)}
                                    onKeyDown={handleCcKeyDown}
                                    onBlur={() => {
                                        if (ccInput.trim()) addCcEmail(ccInput);
                                    }}
                                    placeholder={ccEmails.length === 0 ? 'Add Cc...' : ''}
                                    className="flex-1 min-w-[120px] text-sm outline-none placeholder:text-neutral-400 bg-transparent"
                                    disabled={isSending}
                                />
                            </div>
                        </div>

                        {/* Subject field */}
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                                Subject
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none"
                                disabled={isSending}
                            />
                        </div>

                        {/* Message body with toolbar */}
                        <div>
                            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
                                Message
                            </label>
                            <div className="flex items-center gap-1 border border-neutral-200 border-b-0 rounded-t-lg px-2 py-1.5 bg-neutral-50">
                                {toolbarIcons.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        aria-label={icon.replace(/_/g, ' ')}
                                        className="p-1.5 rounded hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700 transition-colors"
                                    >
                                        <MaterialIcon name={icon} size={18} />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={messageBody}
                                onChange={(e) => setMessageBody(e.target.value)}
                                className="w-full border border-neutral-200 rounded-b-lg px-3 py-3 text-sm leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none min-h-[140px]"
                                disabled={isSending}
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <div className="flex items-center gap-2">
                                <MaterialIcon
                                    name="attach_file"
                                    size={18}
                                    className="text-neutral-500"
                                />
                                <span className="text-sm font-medium text-neutral-700">
                                    Attachments
                                </span>
                                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {mockAttachments.length}
                                </span>
                            </div>
                            <div className="flex gap-3 mt-2">
                                {mockAttachments.map((file) => (
                                    <div
                                        key={file.name}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 min-w-[180px]"
                                    >
                                        <div
                                            className={`size-8 rounded-lg flex items-center justify-center ${
                                                file.type === 'pdf'
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-blue-100 text-blue-600'
                                            }`}
                                        >
                                            <MaterialIcon
                                                name={
                                                    file.type === 'pdf'
                                                        ? 'picture_as_pdf'
                                                        : 'description'
                                                }
                                                size={18}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-neutral-500">{file.size}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANE — Email Preview */}
                    <div className="w-[45%] bg-neutral-50 flex flex-col overflow-y-auto">
                        {/* Desktop/Mobile toggle */}
                        <div className="flex items-center gap-1 p-3">
                            <button
                                type="button"
                                onClick={() => setPreviewMode('desktop')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                    previewMode === 'desktop'
                                        ? 'bg-white border border-neutral-200 shadow-sm text-neutral-900 font-medium'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                            >
                                <MaterialIcon name="computer" size={14} />
                                Desktop
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewMode('mobile')}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                    previewMode === 'mobile'
                                        ? 'bg-white border border-neutral-200 shadow-sm text-neutral-900 font-medium'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                }`}
                            >
                                <MaterialIcon name="smartphone" size={14} />
                                Mobile
                            </button>
                        </div>

                        {/* Email preview card */}
                        <div
                            className={`mx-4 mb-4 ${previewMode === 'mobile' ? 'max-w-[320px] mx-auto' : ''}`}
                        >
                            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
                                {/* Preview header */}
                                <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-indigo-700 text-white font-bold text-sm flex items-center justify-center">
                                            {orgName.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-neutral-900">
                                            {orgName}
                                        </span>
                                    </div>
                                    <span className="text-xs text-neutral-400">Just now</span>
                                </div>

                                {/* Subject */}
                                <div className="px-4 pt-4">
                                    <h3 className="text-lg font-bold text-neutral-900">
                                        {subject || 'No subject'}
                                    </h3>
                                </div>

                                {/* Body */}
                                <div className="px-4 py-3 text-sm text-neutral-700 leading-relaxed space-y-3">
                                    <p>Hi {firstName},</p>
                                    <p>
                                        {senderName} has sent you a document via CLM for your
                                        review and signature.
                                    </p>
                                    {messageBody && (
                                        <div className="border-l-4 border-indigo-600 pl-4 py-2 bg-indigo-50/50 rounded-r-lg text-sm text-indigo-900 italic whitespace-pre-line">
                                            {messageBody}
                                        </div>
                                    )}
                                    <p>
                                        Please click the button below to access the secure
                                        document portal.
                                    </p>
                                </div>

                                {/* CTA Button */}
                                <div className="flex justify-center mx-4 mb-4">
                                    <span className="inline-flex items-center justify-center gap-2 bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-sm w-full max-w-[200px]">
                                        Review &amp; Sign
                                    </span>
                                </div>

                                {/* Attached documents */}
                                <div className="px-4 pb-4">
                                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                        Attached Documents
                                    </p>
                                    <div className="space-y-2">
                                        {mockAttachments.map((file) => (
                                            <div
                                                key={file.name}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50 border border-neutral-100"
                                            >
                                                <div
                                                    className={`size-6 rounded flex items-center justify-center ${
                                                        file.type === 'pdf'
                                                            ? 'bg-red-100 text-red-600'
                                                            : 'bg-blue-100 text-blue-600'
                                                    }`}
                                                >
                                                    <MaterialIcon
                                                        name={
                                                            file.type === 'pdf'
                                                                ? 'picture_as_pdf'
                                                                : 'description'
                                                        }
                                                        size={14}
                                                    />
                                                </div>
                                                <span className="text-sm text-neutral-700">
                                                    {file.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSending}
                            className="text-sm font-medium text-neutral-600 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                            Save as Draft
                        </button>
                        <span className="text-xs text-neutral-400">
                            Replies sent to work email
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSending}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={toEmails.length === 0 || isSending}
                            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-neutral-300 text-white font-bold py-2.5 px-6 rounded-lg text-sm shadow-md transition-all"
                        >
                            {isSending ? (
                                <>
                                    <MaterialIcon
                                        name="sync"
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <MaterialIcon name="send" size={18} />
                                    Send Email
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
