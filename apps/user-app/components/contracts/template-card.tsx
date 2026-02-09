'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/ui/material-icon';
import { TemplateCategory } from '@repo/types';
import { cn } from '@repo/ui';

interface CategoryConfig {
    topBarColor: string;
    iconBg: string;
    iconRing: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    titleHover: string;
    icon: string;
    label: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
    [TemplateCategory.SERVICE_AGREEMENT]: {
        topBarColor: 'bg-blue-500',
        iconBg: 'bg-blue-50',
        iconRing: 'ring-blue-100',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-50',
        badgeText: 'text-blue-700',
        badgeBorder: 'border-blue-100',
        titleHover: 'group-hover:text-blue-700',
        icon: 'design_services',
        label: 'Service Agreement'
    },
    [TemplateCategory.NDA]: {
        topBarColor: 'bg-green-500',
        iconBg: 'bg-green-50',
        iconRing: 'ring-green-100',
        iconColor: 'text-green-600',
        badgeBg: 'bg-green-50',
        badgeText: 'text-green-700',
        badgeBorder: 'border-green-100',
        titleHover: 'group-hover:text-green-700',
        icon: 'lock',
        label: 'NDA'
    },
    [TemplateCategory.PURCHASE_ORDER]: {
        topBarColor: 'bg-orange-500',
        iconBg: 'bg-orange-50',
        iconRing: 'ring-orange-100',
        iconColor: 'text-orange-600',
        badgeBg: 'bg-orange-50',
        badgeText: 'text-orange-700',
        badgeBorder: 'border-orange-100',
        titleHover: 'group-hover:text-orange-700',
        icon: 'shopping_cart',
        label: 'Purchase Order'
    },
    [TemplateCategory.VENDOR_AGREEMENT]: {
        topBarColor: 'bg-purple-500',
        iconBg: 'bg-purple-50',
        iconRing: 'ring-purple-100',
        iconColor: 'text-purple-600',
        badgeBg: 'bg-purple-50',
        badgeText: 'text-purple-700',
        badgeBorder: 'border-purple-100',
        titleHover: 'group-hover:text-purple-700',
        icon: 'storefront',
        label: 'Vendor Agreement'
    },
    [TemplateCategory.EMPLOYMENT]: {
        topBarColor: 'bg-teal-500',
        iconBg: 'bg-teal-50',
        iconRing: 'ring-teal-100',
        iconColor: 'text-teal-600',
        badgeBg: 'bg-teal-50',
        badgeText: 'text-teal-700',
        badgeBorder: 'border-teal-100',
        titleHover: 'group-hover:text-teal-700',
        icon: 'badge',
        label: 'Employment'
    },
    [TemplateCategory.LEASE]: {
        topBarColor: 'bg-amber-500',
        iconBg: 'bg-amber-50',
        iconRing: 'ring-amber-100',
        iconColor: 'text-amber-600',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        badgeBorder: 'border-amber-100',
        titleHover: 'group-hover:text-amber-700',
        icon: 'apartment',
        label: 'Lease'
    },
    [TemplateCategory.OTHER]: {
        topBarColor: 'bg-neutral-500',
        iconBg: 'bg-neutral-50',
        iconRing: 'ring-neutral-100',
        iconColor: 'text-neutral-600',
        badgeBg: 'bg-neutral-50',
        badgeText: 'text-neutral-700',
        badgeBorder: 'border-neutral-100',
        titleHover: 'group-hover:text-neutral-700',
        icon: 'description',
        label: 'Other'
    },
};

const DEFAULT_CONFIG: CategoryConfig = {
    topBarColor: 'bg-neutral-500',
    iconBg: 'bg-neutral-50',
    iconRing: 'ring-neutral-100',
    iconColor: 'text-neutral-600',
    badgeBg: 'bg-neutral-50',
    badgeText: 'text-neutral-700',
    badgeBorder: 'border-neutral-100',
    titleHover: 'group-hover:text-neutral-700',
    icon: 'description',
    label: 'Template',
};

interface TemplateCardProps {
    id: string;
    name: string;
    description?: string;
    category: string;
    isActive: boolean;
    version?: string;
    updatedAt?: string;
}

export function TemplateCard({
    id,
    name,
    description,
    category,
    isActive,
    version,
    updatedAt
}: TemplateCardProps) {
    const config = CATEGORY_CONFIG[category] ?? DEFAULT_CONFIG;

    // Format date if available
    const formattedDate = updatedAt
        ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null;

    return (
        <div className="group relative rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
            {/* Colored top bar - shows on hover */}
            <div
                className={cn(
                    'h-1 transition-opacity duration-200 opacity-0 group-hover:opacity-100',
                    config.topBarColor
                )}
            />

            {/* Card content */}
            <div className="p-6">
                {/* Icon + Category badge row */}
                <div className="flex items-start justify-between mb-4">
                    {/* Icon with colored background */}
                    <div
                        className={cn(
                            'size-10 rounded-lg flex items-center justify-center ring-1 ring-inset',
                            config.iconBg,
                            config.iconRing
                        )}
                    >
                        <MaterialIcon
                            name={config.icon}
                            size={20}
                            className={config.iconColor}
                        />
                    </div>

                    {/* Category badge */}
                    <span
                        className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium border',
                            config.badgeBg,
                            config.badgeText,
                            config.badgeBorder
                        )}
                    >
                        {config.label}
                    </span>
                </div>

                {/* Template title - color changes on hover */}
                <h3
                    className={cn(
                        'text-lg font-bold text-neutral-900 mb-2 transition-colors duration-200',
                        config.titleHover
                    )}
                >
                    {name}
                </h3>

                {/* Description */}
                <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2 min-h-[2.5rem] mb-4">
                    {description || 'No description available.'}
                </p>

                {/* Footer metadata */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
                    {isActive && (
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                            <MaterialIcon name="check_circle" size={14} />
                            Approved
                        </span>
                    )}
                    {version && (
                        <>
                            {isActive && <span>•</span>}
                            <span>v{version}</span>
                        </>
                    )}
                    {formattedDate && (
                        <>
                            {(version || isActive) && <span>•</span>}
                            <span>{formattedDate}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Footer with Use Template button */}
            <div className="bg-neutral-50/50 border-t border-neutral-100 px-6 py-3">
                <Link
                    href={`/dashboard/contracts/create/${id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-medium transition-colors duration-200"
                >
                    Use Template
                </Link>
            </div>
        </div>
    );
}
