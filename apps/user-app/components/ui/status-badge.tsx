import { MaterialIcon } from './material-icon';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'draft' | 'pending' | 'active' | 'expired';

interface StatusBadgeProps {
    variant: BadgeVariant;
    children: React.ReactNode;
    icon?: string;
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    primary: 'bg-primary-100 text-primary-700 border-primary-200',
    success: 'bg-success-light text-success-dark border-success/20',
    warning: 'bg-warning-light text-warning-dark border-warning/20',
    error: 'bg-error-light text-error-dark border-error/20',
    info: 'bg-info-light text-info-dark border-info/20',
    // Contract-specific status variants
    draft: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    pending: 'bg-warning-light text-warning-dark border-warning/20',
    active: 'bg-success-light text-success-dark border-success/20',
    expired: 'bg-error-light text-error-dark border-error/20',
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

export function StatusBadge({
    variant,
    children,
    icon,
    size = 'sm',
    className = '',
}: StatusBadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
        >
            {icon && <MaterialIcon name={icon} size={size === 'sm' ? 12 : 14} />}
            {children}
        </span>
    );
}

// Pre-configured status badges for common contract states
export function ContractStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { variant: BadgeVariant; label: string; icon?: string }> = {
        draft: { variant: 'draft', label: 'Draft', icon: 'edit_note' },
        pending_review: { variant: 'pending', label: 'Review Pending', icon: 'schedule' },
        in_review: { variant: 'info', label: 'In Review', icon: 'visibility' },
        needs_approval: { variant: 'warning', label: 'Needs Approval', icon: 'priority_high' },
        approved: { variant: 'success', label: 'Approved', icon: 'check_circle' },
        active: { variant: 'active', label: 'Active', icon: 'verified' },
        expired: { variant: 'expired', label: 'Expired', icon: 'event_busy' },
        rejected: { variant: 'error', label: 'Rejected', icon: 'cancel' },
        needs_signature: { variant: 'warning', label: 'Needs Signature', icon: 'draw' },
        escalated: { variant: 'error', label: 'Escalated', icon: 'warning' },
        expiring: { variant: 'warning', label: 'Expiring', icon: 'hourglass_top' },
    };

    const config = statusConfig[status.toLowerCase().replace(/\s+/g, '_')] || {
        variant: 'default' as BadgeVariant,
        label: status,
    };

    return (
        <StatusBadge variant={config.variant} icon={config.icon}>
            {config.label}
        </StatusBadge>
    );
}

export default StatusBadge;
