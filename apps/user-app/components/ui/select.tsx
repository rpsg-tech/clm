'use client';

import * as React from 'react';
import { cn } from '@repo/ui';
import { ChevronDown, Check } from 'lucide-react';

interface SelectContextType {
    value?: string;
    onValueChange?: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

const Select = ({
    children,
    value,
    onValueChange,
}: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
}) => {
    const [open, setOpen] = React.useState(false);

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (open && !(event.target as Element).closest('.select-root')) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
            <div className="relative select-root w-full">{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error('SelectTrigger must be used within Select');

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => context.setOpen(!context.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    // This is a simplification. In a real Radix implementation, this would find the selected item's label.
    // Here we rely on the parent to pass the correct children or we handle it via context if we stored labels.
    // For now, let's assume the 'value' is displayed effectively or we need a way to look it up.
    // WARNING: This implementation is naive. It displays the 'value' if no children are found matching? 
    // Actually, Radix SelectValue displays the LABEL of the selected item. 
    // To achieve that here without complex traversal, we might need a mapping or just render the children if passed, or the value.

    // To make this work with the existing code `Versions` where we display generic text, 
    // we need to be able to render the selected option's text.
    // Since we don't have easy access to the children of SelectContent here, 
    // a common hack without a library is to rely on the user passing the label as children to SelectValue not supported by standard Radix API (it takes placeholder).

    // Let's implement a 'registry' approach? No, too complex.
    // Let's use a simpler approach: The API strictly uses `SelectItem` with children.
    // We can't easily access the children of SelectItem from here without traversing `SelectContent`.

    // ADJUSTMENT: We will assume the `value` is descriptive enough OR we accept that it might show the ID if we just show context.value.
    // BUT, the versions dropdown shows "v1 - Date". We definitely want that text.

    // Hack: We'll add a 'labelMap' to the context and have SelectItems register themselves.

    return (
        <span
            ref={ref}
            className={cn("block truncate", className)}
            {...props}
        >
            <SelectValueInner placeholder={placeholder} />
        </span>
    );
});
SelectValue.displayName = "SelectValue";

const SelectValueInner = ({ placeholder }: { placeholder?: string }) => {
    const context = React.useContext(SelectContext);
    const [label, setLabel] = React.useState<React.ReactNode>(null);

    // Listen for label updates from items
    React.useEffect(() => {
        const handleLabelUpdate = (e: CustomEvent) => {
            if (e.detail.value === context?.value) {
                setLabel(e.detail.children);
            }
        };
        window.addEventListener('select-label-update' as any, handleLabelUpdate as any);
        return () => window.removeEventListener('select-label-update' as any, handleLabelUpdate as any);
    }, [context?.value]);

    // Trigger a re-broadcast
    React.useEffect(() => {
        window.dispatchEvent(new Event('select-query-labels'));
    }, [context?.value]);

    if (!context?.value) return (
        <span className="text-neutral-500">{placeholder}</span>
    );

    return <>{label || context.value}</>;
}


const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context || !context.open) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-neutral-200 bg-white text-neutral-950 shadow-md animate-in fade-in-80 mt-1 w-full",
                className
            )}
            {...props}
        >
            <div className="w-full p-1 max-h-60 overflow-y-auto">
                {children}
            </div>
        </div>
    );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext);

    // Broadcast label on mount or query
    React.useEffect(() => {
        const broadcast = () => {
            const event = new CustomEvent('select-label-update', { detail: { value, children } });
            window.dispatchEvent(event);
        };
        broadcast();

        const handleQuery = () => broadcast();
        window.addEventListener('select-query-labels', handleQuery);
        return () => window.removeEventListener('select-query-labels', handleQuery);
    }, [value, children]);


    if (!context) throw new Error('SelectItem must be used within Select');

    const isSelected = context.value === value;

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-neutral-100 focus:bg-neutral-100 focus:text-neutral-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                isSelected && "bg-neutral-100 font-medium",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                context.onValueChange?.(value);
                context.setOpen(false);
            }}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            <span className="truncate">{children}</span>
        </div>
    );
});
SelectItem.displayName = "SelectItem";

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
};

// Stubs for unused components to prevent errors if imported
const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const SelectLabel = ({ children }: { children: React.ReactNode }) => <div className="px-2 py-1.5 text-sm font-semibold">{children}</div>;
const SelectSeparator = () => <div className="-mx-1 my-1 h-px bg-neutral-100" />;
