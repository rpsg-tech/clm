import { ContractStatus } from '@repo/types';

export interface StatusDisplay {
    label: string;
    bg: string;
    text: string;
    ring: string;
    icon: string;
}

const STATUS_MAP: Record<ContractStatus, StatusDisplay> = {
    [ContractStatus.DRAFT]: {
        label: 'Draft',
        bg: 'bg-neutral-50',
        text: 'text-neutral-600',
        ring: 'ring-neutral-300',
        icon: 'edit_note',
    },
    [ContractStatus.SENT_TO_LEGAL]: {
        label: 'Sent to Legal',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        ring: 'ring-blue-600/20',
        icon: 'gavel',
    },
    [ContractStatus.LEGAL_REVIEW_IN_PROGRESS]: {
        label: 'Under Legal Review',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        ring: 'ring-yellow-600/20',
        icon: 'policy',
    },
    [ContractStatus.REVISION_REQUESTED]: {
        label: 'Revision Requested',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        ring: 'ring-amber-600/20',
        icon: 'rate_review',
    },
    [ContractStatus.LEGAL_APPROVED]: {
        label: 'Legal Approved',
        bg: 'bg-green-50',
        text: 'text-green-700',
        ring: 'ring-green-600/20',
        icon: 'verified',
    },
    [ContractStatus.SENT_TO_FINANCE]: {
        label: 'Sent to Finance',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        ring: 'ring-blue-600/20',
        icon: 'account_balance',
    },
    [ContractStatus.FINANCE_REVIEW_IN_PROGRESS]: {
        label: 'Under Finance Review',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        ring: 'ring-yellow-600/20',
        icon: 'account_balance',
    },
    [ContractStatus.FINANCE_REVIEWED]: {
        label: 'Finance Approved',
        bg: 'bg-green-50',
        text: 'text-green-700',
        ring: 'ring-green-600/20',
        icon: 'paid',
    },
    [ContractStatus.IN_REVIEW]: {
        label: 'Under Review',
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        ring: 'ring-yellow-600/20',
        icon: 'pending_actions',
    },
    [ContractStatus.APPROVED]: {
        label: 'Approved',
        bg: 'bg-green-50',
        text: 'text-green-700',
        ring: 'ring-green-600/20',
        icon: 'check_circle',
    },
    [ContractStatus.SENT_TO_COUNTERPARTY]: {
        label: 'Sent to Counterparty',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        ring: 'ring-blue-600/20',
        icon: 'send',
    },
    [ContractStatus.COUNTERSIGNED]: {
        label: 'Signed',
        bg: 'bg-green-50',
        text: 'text-green-700',
        ring: 'ring-green-600/20',
        icon: 'handshake',
    },
    [ContractStatus.ACTIVE]: {
        label: 'Active',
        bg: 'bg-green-50',
        text: 'text-green-700',
        ring: 'ring-green-600/20',
        icon: 'check_circle',
    },
    [ContractStatus.EXPIRED]: {
        label: 'Expired',
        bg: 'bg-red-50',
        text: 'text-red-700',
        ring: 'ring-red-600/20',
        icon: 'event_busy',
    },
    [ContractStatus.TERMINATED]: {
        label: 'Terminated',
        bg: 'bg-red-50',
        text: 'text-red-700',
        ring: 'ring-red-600/20',
        icon: 'cancel',
    },
    [ContractStatus.REJECTED]: {
        label: 'Sent Back',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        ring: 'ring-amber-600/20',
        icon: 'undo',
    },
    [ContractStatus.CANCELLED]: {
        label: 'Cancelled',
        bg: 'bg-neutral-50',
        text: 'text-neutral-600',
        ring: 'ring-neutral-300',
        icon: 'block',
    },
    [ContractStatus.EXECUTED]: {
        label: 'Executed',
        bg: 'bg-green-50',
        text: 'text-green-700',
        ring: 'ring-green-600/20',
        icon: 'task_alt',
    },
};

/** Computed "Expiring" display for contracts near their endDate */
export const EXPIRING_DISPLAY: StatusDisplay = {
    label: 'Expiring',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-600/20',
    icon: 'schedule',
};

const FALLBACK_DISPLAY: StatusDisplay = {
    label: 'Unknown',
    bg: 'bg-neutral-50',
    text: 'text-neutral-500',
    ring: 'ring-neutral-300',
    icon: 'help_outline',
};

export function getStatusDisplay(status: ContractStatus): StatusDisplay {
    return STATUS_MAP[status] ?? FALLBACK_DISPLAY;
}

/** Badge class string for use with inline rendering */
export function getStatusBadgeClasses(status: ContractStatus): string {
    const s = STATUS_MAP[status] ?? FALLBACK_DISPLAY;
    return `${s.bg} ${s.text} ring-1 ring-inset ${s.ring}`;
}

/**
 * Check if a contract is expiring based on its endDate.
 * Returns tier 1 (<=30d), tier 2 (<=60d), tier 3 (<=90d), or null.
 */
export function getExpiryTier(endDate: Date | string | undefined): 1 | 2 | 3 | null {
    if (!endDate) return null;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return null; // Already expired
    if (daysLeft <= 30) return 1;
    if (daysLeft <= 60) return 2;
    if (daysLeft <= 90) return 3;
    return null;
}

export function getExpiryDisplay(tier: 1 | 2 | 3): StatusDisplay {
    if (tier === 1) {
        return { ...EXPIRING_DISPLAY, bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20' };
    }
    return EXPIRING_DISPLAY;
}
