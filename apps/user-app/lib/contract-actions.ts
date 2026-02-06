import { ContractStatus, RoleCode } from '@repo/types';

export interface ContractAction {
    key: string;
    label: string;
    icon: string;
    variant: 'primary' | 'secondary' | 'destructive';
    type: 'link' | 'handler';
    href?: string;
}

export const LEGAL_ROLES: string[] = [
    RoleCode.LEGAL_HEAD,
    RoleCode.LEGAL_MANAGER,
    RoleCode.SUPER_ADMIN,
    RoleCode.ENTITY_ADMIN,
];

const TERMINAL_STATUSES = new Set<string>([
    ContractStatus.ACTIVE,
    ContractStatus.CANCELLED,
    ContractStatus.EXECUTED,
    ContractStatus.EXPIRED,
    ContractStatus.TERMINATED,
    ContractStatus.REJECTED,
]);

export function getContractActions(
    status: string,
    role: string | null,
    contractId: string,
): ContractAction[] {
    const isLegal = role ? LEGAL_ROLES.includes(role) : false;

    if (TERMINAL_STATUSES.has(status)) {
        return [
            { key: 'view', label: 'View Document', icon: 'visibility', variant: 'secondary', type: 'link', href: `/dashboard/contracts/${contractId}/edit` },
        ];
    }

    const actions: ContractAction[] = [];

    switch (status) {
        case ContractStatus.DRAFT:
            if (isLegal) {
                actions.push({ key: 'edit', label: 'Edit', icon: 'edit', variant: 'primary', type: 'link', href: `/dashboard/contracts/${contractId}/edit` });
            } else {
                actions.push({ key: 'submit', label: 'Submit for Review', icon: 'send', variant: 'primary', type: 'handler' });
            }
            break;

        case ContractStatus.REVISION_REQUESTED:
            if (isLegal) {
                actions.push({ key: 'edit', label: 'Edit', icon: 'edit', variant: 'primary', type: 'link', href: `/dashboard/contracts/${contractId}/edit` });
            } else {
                actions.push({ key: 'resubmit', label: 'Resubmit for Review', icon: 'send', variant: 'primary', type: 'handler' });
            }
            break;

        case ContractStatus.IN_REVIEW:
        case ContractStatus.SENT_TO_LEGAL:
        case ContractStatus.LEGAL_REVIEW_IN_PROGRESS:
        case ContractStatus.SENT_TO_FINANCE:
        case ContractStatus.FINANCE_REVIEW_IN_PROGRESS:
        case ContractStatus.LEGAL_APPROVED:
        case ContractStatus.FINANCE_REVIEWED:
            // In review — no primary action, just view + cancel
            break;

        case ContractStatus.APPROVED:
            actions.push({ key: 'send', label: 'Send to Counterparty', icon: 'send', variant: 'primary', type: 'handler' });
            break;

        case ContractStatus.SENT_TO_COUNTERPARTY:
        case ContractStatus.COUNTERSIGNED:
            actions.push({ key: 'upload-signed', label: 'Upload Signed Copy', icon: 'upload_file', variant: 'primary', type: 'handler' });
            break;
    }

    // View Document — always for non-terminal
    actions.push({ key: 'view', label: 'View Document', icon: 'visibility', variant: 'secondary', type: 'link', href: `/dashboard/contracts/${contractId}/edit` });

    // Cancel — available for all non-terminal statuses
    actions.push({ key: 'cancel', label: 'Cancel', icon: 'cancel', variant: 'destructive', type: 'handler' });

    return actions;
}
