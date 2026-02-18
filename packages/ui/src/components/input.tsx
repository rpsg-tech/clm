"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
    hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, label, hint, id, ...props }, ref) => {
        const inputId = id || React.useId();

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-bold text-neutral-700 uppercase tracking-[0.1em] mb-2"
                    >
                        {label}
                        {props.required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        "flex h-10 w-full rounded-xl border-2 bg-white px-3 py-2 text-sm transition-all duration-200",
                        "placeholder:text-neutral-400",
                        "focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10",
                        "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
                        error
                            ? "border-error focus:border-error-dark focus:ring-error/10"
                            : "border-neutral-200 hover:border-neutral-300",
                        className
                    )}
                    ref={ref}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                    {...props}
                />
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-neutral-500">
                        {hint}
                    </p>
                )}
                {error && (
                    <p id={`${inputId}-error`} className="mt-1.5 text-xs text-error font-semibold" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
