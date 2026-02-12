import { Spinner } from "@repo/ui";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
    icon: LucideIcon;
    label: string;
    subLabel?: string;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    variant?: 'primary' | 'outline';
    className?: string;
    compact?: boolean; // Context from parent (header vs sidebar)
}

export function ActionButton({
    icon: Icon,
    label,
    subLabel,
    onClick,
    disabled,
    loading,
    variant = 'outline',
    className,
    compact = false
}: ActionButtonProps) {

    // Shared Icon placement logic
    const isHeader = compact;

    const IconWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className={`
            flex items-center justify-center rounded-md transition-all duration-300 shrink-0
            ${isHeader ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'}
            ${variant === 'primary' ? 'bg-white/10 group-hover:bg-white/20' : 'bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:scale-110'}
        `}>
            {children}
        </div>
    );

    const buttonBaseClasses = `
        group relative flex items-center justify-center sm:justify-start gap-2.5 transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        w-full ${isHeader ? '' : 'sm:w-auto'} rounded-xl
        ${isHeader ? 'px-3 py-2' : 'pl-3 pr-4 py-2.5'}
        ${className || ''}
    `;

    if (variant === 'primary') {
        return (
            <button
                onClick={onClick}
                disabled={disabled || loading}
                className={`
                    ${buttonBaseClasses}
                    bg-slate-900 text-white border border-transparent
                    shadow-[0_2px_8px_0_rgba(15,23,42,0.30)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0 active:scale-[0.98]
                    disabled:shadow-none
                `}
            >
                <IconWrapper>
                    {loading ? <Spinner size="sm" className="text-white" /> : <Icon className={`${isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />}
                </IconWrapper>
                <div className="text-left block relative z-10">
                    <div className={`font-bold leading-none tracking-wide ${isHeader ? 'text-[11px] mb-0.5' : 'text-xs mb-0.5'}`}>{label}</div>
                    {subLabel && <div className="text-[9px] text-slate-300 font-medium leading-none opacity-80">{subLabel}</div>}
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`
                ${buttonBaseClasses}
                bg-white border border-slate-200 text-slate-600
                hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0
            `}
        >
            <div className={`
                flex items-center justify-center rounded-md bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300 border border-slate-100 group-hover:border-orange-100
                ${isHeader ? 'w-7 h-7' : 'w-8 h-8'}
            `}>
                {loading ? <Spinner size="sm" /> : <Icon className={`${isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
            </div>
            <div className="text-left">
                <div className={`font-bold leading-none tracking-wide ${isHeader ? 'text-[11px]' : 'text-xs'}`}>{label}</div>
                {subLabel && <div className="text-[9px] text-slate-400 group-hover:text-orange-600/70 font-medium leading-none mt-0.5">{subLabel}</div>}
            </div>
        </button>
    );
}
