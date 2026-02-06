/**
 * Formatting utilities for CLM Enterprise
 *
 * INR currency (Indian number system), dates, and relative time.
 */

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

/** Format a number as INR: ₹1,50,000 */
export function formatINR(amount: number | string | undefined | null): string {
    if (amount == null) return '—';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '—';
    return INR_FORMATTER.format(num);
}

/** Compact INR for dashboards: ₹1.5L, ₹2.3Cr */
export function formatINRCompact(amount: number | string | undefined | null): string {
    if (amount == null) return '—';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '—';
    if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(1)}Cr`;
    if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`;
    if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
});

/** Format date as "06 Feb 2026" */
export function formatDate(date: Date | string | undefined | null): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    return DATE_FORMATTER.format(d);
}

/** Format date+time as "06 Feb 2026, 02:30 pm" */
export function formatDateTime(date: Date | string | undefined | null): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    return DATETIME_FORMATTER.format(d);
}

/** Relative time: "2 hours ago", "3 days ago", "just now" */
export function formatRelativeTime(date: Date | string | undefined | null): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';

    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(d);
}

/** Days remaining until a date, or negative if past */
export function daysUntil(date: Date | string | undefined | null): number | null {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Truncate text with ellipsis */
export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + '…';
}

/** Capitalize first letter */
export function capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
