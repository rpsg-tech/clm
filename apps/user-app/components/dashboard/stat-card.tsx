import { LucideIcon } from "lucide-react";
import { Card, cn } from "@repo/ui";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        label: string;
        positive?: boolean;
    };
    description?: string;
    className?: string;
    variant?: "blue" | "emerald" | "orange" | "purple";
    delay?: number;
}

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    description,
    className,
    variant = "blue",
    delay = 0
}: StatCardProps) {
    const variants = {
        blue: {
            bg: "bg-gradient-to-br from-blue-50 to-white",
            iconBg: "bg-blue-100/50 text-blue-600",
            border: "group-hover:border-blue-200",
            shadow: "group-hover:shadow-blue-100",
            text: "text-blue-900",
        },
        emerald: {
            bg: "bg-gradient-to-br from-emerald-50 to-white",
            iconBg: "bg-emerald-100/50 text-emerald-600",
            border: "group-hover:border-emerald-200",
            shadow: "group-hover:shadow-emerald-100",
            text: "text-emerald-900",
        },
        orange: {
            bg: "bg-gradient-to-br from-orange-50 to-white",
            iconBg: "bg-orange-100/50 text-orange-600",
            border: "group-hover:border-orange-200",
            shadow: "group-hover:shadow-orange-100",
            text: "text-orange-900",
        },
        purple: {
            bg: "bg-gradient-to-br from-purple-50 to-white",
            iconBg: "bg-purple-100/50 text-purple-600",
            border: "group-hover:border-purple-200",
            shadow: "group-hover:shadow-purple-100",
            text: "text-purple-900",
        },
    };

    const styles = variants[variant];

    return (
        <Card
            className={cn(
                "relative overflow-hidden border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards",
                styles.bg,
                styles.border,
                styles.shadow,
                className
            )}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/40 blur-2xl transition-all duration-500 group-hover:bg-white/60" />

            <div className="relative p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {title}
                        </p>
                        <h3 className={cn("text-4xl font-bold tracking-tight", styles.text)}>
                            {value}
                        </h3>
                    </div>
                    <div className={cn("p-3 rounded-xl transition-colors duration-300", styles.iconBg)}>
                        <Icon size={22} className="stroke-[2.5px]" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {trend ? (
                        <>
                            <div className={cn(
                                "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                                trend.positive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-rose-100 text-rose-700"
                            )}>
                                {trend.positive ? "↑" : "↓"} {trend.value}
                            </div>
                            <span className="text-slate-400 text-xs font-medium">
                                {trend.label}
                            </span>
                        </>
                    ) : description ? (
                        <p className="text-slate-400 text-xs font-medium">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
        </Card>
    );
}
