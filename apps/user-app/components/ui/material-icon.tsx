import { cn } from "@repo/ui";

interface MaterialIconProps {
    name: string;
    className?: string;
    size?: number; // Font size in px, defaults to 24px (standard) or 20px (dense)
}

export function MaterialIcon({ name, className, size }: MaterialIconProps) {
    return (
        <span
            className={cn("material-symbols-outlined select-none", className)}
            style={size ? { fontSize: `${size}px` } : undefined}
            aria-hidden="true"
        >
            {name}
        </span>
    );
}
