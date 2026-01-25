import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and optimizes Tailwind classes with twMerge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
