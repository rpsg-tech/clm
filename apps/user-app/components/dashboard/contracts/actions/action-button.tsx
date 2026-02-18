import { Button, Spinner } from "@repo/ui";
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
    compact?: boolean;
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

    const isHeader = compact;

    if (variant === 'primary') {
        return (
            <Button
                onClick={onClick}
                disabled={disabled || loading}
                variant="default"
                size="default"
                className={`w-auto ${isHeader ? "" : "w-full sm:w-auto"} justify-start gap-2.5 ${className || ""}`}
            >
                <div className="flex items-center justify-center rounded-md bg-white/10 group-hover:bg-white/20 transition-all duration-300 shrink-0 w-6 h-6">
                    {loading ? <Spinner size="sm" className="text-white" /> : <Icon className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`text-left block relative z-10 ${isHeader ? "hidden sm:block" : ""}`}>
                    <div className={`font-bold leading-none tracking-wide ${isHeader ? "text-[11px] mb-0.5" : "text-xs mb-0.5"}`}>{label}</div>
                    {subLabel && <div className="text-[9px] text-white/70 font-medium leading-none opacity-80">{subLabel}</div>}
                </div>
            </Button>
        );
    }

    return (
        <Button
            onClick={onClick}
            disabled={disabled || loading}
            variant="outline"
            size="default"
            className={`w-auto ${isHeader ? "" : "w-full sm:w-auto"} justify-start gap-2.5 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-700 ${className || ""}`}
        >
            <div className={`flex items-center justify-center rounded-md bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-orange-500 group-hover:scale-110 transition-all duration-300 border border-slate-100 group-hover:border-orange-100 ${isHeader ? 'w-7 h-7' : 'w-8 h-8'}`}>
                {loading ? <Spinner size="sm" /> : <Icon className={`${isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
            </div>
            <div className={`text-left ${isHeader ? 'hidden sm:block' : ''}`}>
                <div className={`font-bold leading-none tracking-wide ${isHeader ? 'text-[11px]' : 'text-xs'}`}>{label}</div>
                {subLabel && <div className="text-[9px] text-slate-400 group-hover:text-orange-600/70 font-medium leading-none mt-0.5">{subLabel}</div>}
            </div>
        </Button>
    );
}
