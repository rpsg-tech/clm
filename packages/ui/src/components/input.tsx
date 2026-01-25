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
                        className="block text-sm font-medium text-neutral-700 mb-1.5"
                    >
                        {label}
                        {props.required && <span className="text-error ml-1">*</span>}
                    </label>
                )}
                <input
                    type={type}
                    id={inputId}
                    className={cn(
                        "flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors",
                        "placeholder:text-neutral-400",
                        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
                        "disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400",
                        error
                            ? "border-error focus:ring-error"
                            : "border-neutral-300 hover:border-neutral-400",
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
                    <p id={`${inputId}-error`} className="mt-1.5 text-xs text-error" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
