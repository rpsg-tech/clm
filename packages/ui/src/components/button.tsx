"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:brightness-110 hover:scale-[1.02]",
                destructive:
                    "bg-error text-white shadow-lg shadow-error/30 hover:bg-error-dark hover:shadow-error/50",
                outline:
                    "border-2 border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 hover:border-primary-500 hover:text-primary-600",
                secondary:
                    "bg-white border-2 border-neutral-200 text-neutral-900 shadow-sm hover:border-primary-500 hover:text-primary-600",
                tertiary:
                    "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900",
                ghost:
                    "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                link:
                    "text-primary-500 underline-offset-4 hover:underline",
                success:
                    "bg-success text-white shadow-lg shadow-success/30 hover:bg-success-dark hover:shadow-success/50",
            },
            size: {
                default: "h-10 px-4 py-2 rounded-xl",
                sm: "h-8 px-3 text-xs rounded-lg",
                lg: "h-12 px-6 text-base rounded-xl",
                xl: "h-14 px-8 text-lg rounded-2xl",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Loading...
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
