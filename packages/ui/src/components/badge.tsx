"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "bg-primary-100 text-primary-700",
                secondary: "bg-neutral-100 text-neutral-700",
                success: "bg-success-light text-green-700",
                warning: "bg-warning-light text-amber-700",
                error: "bg-error-light text-red-700",
                info: "bg-info-light text-blue-700",
                outline: "border border-neutral-300 text-neutral-700",
                // Status Variants
                active: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
                draft: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-300",
                underReview: "bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20",
                waiting: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
                blocked: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
