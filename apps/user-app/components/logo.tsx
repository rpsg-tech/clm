import Link from 'next/link';
import { cn } from '@repo/ui';

interface LogoProps {
    className?: string;
    showText?: boolean;
    iconSize?: string; // e.g. "w-10 h-10"
    textSize?: string; // e.g. "text-2xl"
    subTextSize?: string; // e.g. "text-[0.6rem]"
    link?: string; // If provided, wraps in Link
    lightMode?: boolean; // If true, optimizes text for light background (e.g. Login page right side)
}

export function Logo({
    className,
    showText = true,
    iconSize = "w-10 h-10",
    textSize = "text-2xl",
    subTextSize = "text-[0.7rem]",
    link = "/dashboard",
    lightMode = false
}: LogoProps) {
    const Content = () => (
        <div className={cn("flex items-center gap-3", className)}>
            <div className={cn("relative flex-shrink-0 flex items-center justify-center", iconSize)}>
                {/* Outer Glow - Subtle */}
                <div className={cn("absolute inset-0 bg-orange-500/20 blur-xl rounded-[2rem] transition-all group-hover:bg-orange-500/30", lightMode ? "bg-orange-500/10" : "")}></div>

                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                    {/* Squircle Background */}
                    <rect x="5" y="5" width="90" height="90" rx="30" fill="url(#logo_gradient_squircle)" />

                    {/* Star - White, Sharp 4-Point */}
                    <path d="M50 25L57 43L75 50L57 57L50 75L43 57L25 50L43 43L50 25Z" fill="white" />

                    <defs>
                        <linearGradient id="logo_gradient_squircle" x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FB923C" /> {/* Orange 400 */}
                            <stop offset="1" stopColor="#EA580C" /> {/* Orange 600 */}
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col justify-center h-full ml-1">
                    <span className={cn("font-bold tracking-tight leading-none", textSize, lightMode ? "text-slate-900" : "text-white")}>
                        LUMINA
                    </span>
                    <span className={cn("font-bold text-orange-500 tracking-[0.2em] uppercase leading-none mt-1", subTextSize)}>
                        CLM
                    </span>
                </div>
            )}
        </div>
    );

    if (link) {
        return (
            <Link href={link} className="cursor-pointer hover:opacity-95 transition-opacity group">
                <Content />
            </Link>
        );
    }

    return (
        <div className="select-none group">
            <Content />
        </div>
    );
}
