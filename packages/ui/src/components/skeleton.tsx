"use client";

import * as React from "react";
import { cn } from "../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * Controls the animation type
     * @default "pulse"
     */
    animation?: "pulse" | "shimmer" | "none";
}

function Skeleton({ className, animation = "pulse", ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-md bg-neutral-200",
                animation === "pulse" && "animate-pulse",
                animation === "shimmer" && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
                className
            )}
            {...props}
        />
    );
}

// Preset skeleton components for common patterns
function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <Skeleton className={cn("h-4 w-full", className)} {...props} />;
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <Skeleton className={cn("h-10 w-10 rounded-full", className)} {...props} />;
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div className={cn("space-y-3", className)} {...props}>
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
}

function SkeletonTable({ rows = 5, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { rows?: number }) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}

export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonCard, SkeletonTable };
