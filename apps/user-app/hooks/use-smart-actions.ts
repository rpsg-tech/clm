import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface UseSmartActionsProps {
    contract: any;
    permissions: {
        canEdit: boolean;
        canSubmit: boolean;
        canApproveLegal: boolean;
        canApproveFinance: boolean;
        canSend: boolean;
        canCancel: boolean;
    };
    onAction: (action: string, payload?: any) => void;
}

export function useSmartActions({ contract, permissions, onAction }: UseSmartActionsProps) {
    const { role } = useAuth();

    // Dialog States
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showRevisionDialog, setShowRevisionDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    // Action Context State
    const [activeApprovalType, setActiveApprovalType] = useState<'LEGAL' | 'FINANCE' | 'RETURN_TO_MANAGER' | null>(null);
    const [recipientEmails, setRecipientEmails] = useState("");

    // --- Visibility Logic ---

    // Terminal states where certain actions are disabled
    const isTerminal = ['APPROVED', 'ACTIVE', 'CANCELLED', 'REJECTED', 'PENDING_LEGAL_HEAD'].includes(contract.status);

    // Check existing approvals
    const hasLegalApproval = contract.approvals?.some((a: any) => a.type === 'LEGAL' && (a.status === 'PENDING' || a.status === 'APPROVED'));
    const hasFinanceApproval = contract.approvals?.some((a: any) => a.type === 'FINANCE' && (a.status === 'PENDING' || a.status === 'APPROVED'));

    const showSendToLegal = permissions.canSubmit && !hasLegalApproval && !isTerminal;
    const showRequestFinance = permissions.canSubmit && !hasFinanceApproval && !isTerminal;

    // Send to Counterparty: Allow in all non-terminal and non-sent states if user has permission (Parallel Negotiation)
    const showSendToCounterparty = !['ACTIVE', 'CANCELLED', 'REJECTED', 'SENT_TO_COUNTERPARTY'].includes(contract.status) && permissions.canSend;

    // Review Actions Visibility
    const isReviewState = ['IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE', 'LEGAL_REVIEW_IN_PROGRESS', 'FINANCE_REVIEW_IN_PROGRESS', 'PENDING_LEGAL_HEAD'].includes(contract.status);

    // Specific Approval Statuses
    const legalApproval = contract.approvals?.find((a: any) => a.type === 'LEGAL');
    const financeApproval = contract.approvals?.find((a: any) => a.type === 'FINANCE');

    const isLegalPending = legalApproval?.status === 'PENDING';
    const isFinancePending = financeApproval?.status === 'PENDING';
    const isLegalApproved = legalApproval?.status === 'APPROVED';
    const isFinanceApproved = financeApproval?.status === 'APPROVED';

    const isHeadLevelRole = ['SUPER_ADMIN', 'ENTITY_ADMIN', 'LEGAL_HEAD'].includes(role || '');

    // Legal Action Logic
    let showApproveLegal = permissions.canApproveLegal && isLegalPending;
    // Strict restriction for Head level
    if (contract.status === 'PENDING_LEGAL_HEAD' && !isHeadLevelRole) {
        showApproveLegal = false;
    }

    // Return to Manager Logic (Only for Legal Head when PENDING_LEGAL_HEAD)
    const showReturnToManager = (
        contract.status === 'PENDING_LEGAL_HEAD' &&
        isHeadLevelRole &&
        permissions.canApproveLegal // Assuming head has this permission
    );

    const showApproveFinance = permissions.canApproveFinance && isFinancePending;

    // Escalation Logic
    const showEscalateToHead = showApproveLegal && (contract.status !== 'PENDING_LEGAL_HEAD' && contract.status !== 'LEGAL_REVIEW_IN_PROGRESS');

    const showEdit = ['DRAFT', 'REVISION_REQUESTED', 'IN_REVIEW', 'SENT_TO_LEGAL', 'SENT_TO_FINANCE', 'PENDING_LEGAL_HEAD', 'SENT_TO_COUNTERPARTY', 'LEGAL_REVIEW_IN_PROGRESS', 'FINANCE_REVIEW_IN_PROGRESS'].includes(contract.status) && permissions.canEdit;

    const showCancel = showEdit && permissions.canCancel;

    // --- Handlers ---

    const handleConfirmCancel = (reason: string) => {
        onAction('cancel', { reason });
        setShowCancelDialog(false);
    };

    const handleSendToCounterparty = (recipients: string[]) => {
        onAction('send', { recipients });
        setShowSendDialog(false);
    };

    const handleRequestRevision = (comment: string) => {
        // Identify which approval we are acting on (contextual)
        // If user has Legal permission -> Legal Revision
        // If Finance permission -> Finance Revision
        const legalApproval = contract.approvals?.find((a: any) => a.type === 'LEGAL' && a.status === 'PENDING');
        const financeApproval = contract.approvals?.find((a: any) => a.type === 'FINANCE' && a.status === 'PENDING');

        let targetApprovalId;
        if (permissions.canApproveLegal && legalApproval) {
            targetApprovalId = legalApproval.id;
        } else if (permissions.canApproveFinance && financeApproval) {
            targetApprovalId = financeApproval.id;
        }

        if (targetApprovalId) {
            onAction('request_revision', { id: targetApprovalId, comment });
        } else {
            console.error("No pending approval found to revise");
        }
        setShowRevisionDialog(false);
    };

    const handleReturnToManager = (comment: string) => {
        const legalApproval = contract.approvals?.find((a: any) => a.type === 'LEGAL' && a.status === 'PENDING');
        if (legalApproval) {
            onAction('return_to_manager', { id: legalApproval.id, comment });
        }
        setShowRejectDialog(false); // Re-using Reject Dialog for Return? Or create new one? 
        // Let's use Reject Dialog but with a specific type flag or just handle it.
        // Actually, let's use a specific handling flow.
        setActiveApprovalType(null);
    };

    const handleApprove = (comment: string) => {
        if (activeApprovalType === 'LEGAL') {
            onAction('approve_legal', { comment });
        } else if (activeApprovalType === 'FINANCE') {
            onAction('approve_finance', { comment });
        }
        setShowApproveDialog(false);
        setActiveApprovalType(null);
    };

    const handleReject = (comment: string) => {
        if (activeApprovalType === 'RETURN_TO_MANAGER') {
            handleReturnToManager(comment);
            return;
        }

        if (activeApprovalType === 'LEGAL') {
            onAction('reject_legal', { comment });
        } else if (activeApprovalType === 'FINANCE') {
            onAction('reject_finance', { comment });
        }
        setShowRejectDialog(false);
        setActiveApprovalType(null);
    };

    const openApproveDialog = (type: 'LEGAL' | 'FINANCE') => {
        setActiveApprovalType(type);
        setShowApproveDialog(true);
    };

    const openRejectDialog = (type: 'LEGAL' | 'FINANCE' | 'RETURN_TO_MANAGER') => {
        setActiveApprovalType(type as any); // Cast for now or update state type
        setShowRejectDialog(true);
    };

    const openSendToCounterpartyDialog = () => {
        setRecipientEmails(contract.counterpartyEmail || "");
        setShowSendDialog(true);
    };

    const openCancelDialog = () => {
        setShowCancelDialog(true);
    };

    const openRevisionDialog = () => {
        setShowRevisionDialog(true);
    };

    return {
        // Flags
        flags: {
            showSendToLegal,
            showRequestFinance,
            showSendToCounterparty,
            showApproveLegal,
            showApproveFinance,
            showEscalateToHead,
            showReturnToManager,
            showEdit,
            showCancel,
            isReviewState,
            isLegalPending,
            isFinancePending,
            isLegalApproved,
            isFinanceApproved,
            hasLegalApproval,
            hasFinanceApproval,
            isTerminal
        },
        // State
        dialogs: {
            showCancelDialog, setShowCancelDialog,
            showSendDialog, setShowSendDialog,
            showRevisionDialog, setShowRevisionDialog,
            showApproveDialog, setShowApproveDialog,
            showRejectDialog, setShowRejectDialog,
            activeApprovalType, recipientEmails, setRecipientEmails
        },
        // Actions (Openers & Confirmers)
        actions: {
            handleConfirmCancel,
            handleSendToCounterparty,
            handleRequestRevision,
            handleApprove,
            handleReject,

            openApproveDialog,
            openRejectDialog,
            openSendToCounterpartyDialog,
            openCancelDialog,
            openRevisionDialog
        }
    };
}
