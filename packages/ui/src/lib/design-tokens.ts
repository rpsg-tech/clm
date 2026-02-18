/**
 * LUMINA CLM Design System Tokens
 * 
 * Centralized design system constants for consistent UI across the application.
 * Import these tokens instead of hardcoding Tailwind classes.
 */

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const typography = {
    // Headings
    h1: "text-4xl font-black tracking-tighter leading-tight",
    h2: "text-3xl font-black tracking-tighter leading-snug",
    h3: "text-2xl font-bold tracking-tight leading-snug",
    h4: "text-xl font-bold tracking-tight leading-normal",
    h5: "text-lg font-bold tracking-normal leading-normal",
    h6: "text-base font-bold tracking-normal leading-normal",

    // Body Text
    bodyLg: "text-base font-normal tracking-normal",
    body: "text-sm font-normal tracking-normal",
    bodySm: "text-xs font-normal tracking-wide",

    // UI Elements
    label: "text-xs font-bold uppercase tracking-[0.1em]",
    caption: "text-[10px] font-bold uppercase tracking-[0.15em]",
    monospace: "font-mono text-sm tracking-tight",
} as const;

// ============================================================================
// BUTTON VARIANTS
// ============================================================================

export const buttonVariants = {
    // Primary Button (High Emphasis)
    primary: "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-300",

    // Secondary Button (Medium Emphasis)
    secondary: "bg-white border-2 border-slate-200 text-slate-900 font-bold shadow-sm hover:border-orange-500 hover:text-orange-600 active:scale-[0.98] transition-all duration-300",

    // Tertiary Button (Low Emphasis)
    tertiary: "bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 hover:text-slate-900 active:scale-[0.98] transition-all duration-200",

    // Ghost Button (Minimal)
    ghost: "text-slate-600 font-bold hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] transition-all duration-200",

    // Danger Button (Destructive)
    danger: "bg-red-500 text-white font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 hover:shadow-red-500/50 active:scale-[0.98] transition-all duration-300",

    // Success Button
    success: "bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-emerald-500/50 active:scale-[0.98] transition-all duration-300",
} as const;

// ============================================================================
// BUTTON SIZES
// ============================================================================

export const buttonSizes = {
    sm: "h-8 px-3 py-1.5 text-xs rounded-lg",
    md: "h-10 px-4 py-2 text-sm rounded-xl",
    lg: "h-12 px-6 py-3 text-base rounded-xl",
    xl: "h-14 px-8 py-4 text-lg rounded-2xl",
} as const;

// ============================================================================
// FORM ELEMENTS
// ============================================================================

export const formElements = {
    input: "w-full h-10 px-3 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none placeholder:text-slate-400",

    textarea: "w-full px-3 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none placeholder:text-slate-400",

    select: "h-10 px-3 py-2 text-sm bg-white border-2 border-slate-200 rounded-xl transition-all duration-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none cursor-pointer",

    label: "text-xs font-bold text-slate-700 uppercase tracking-[0.1em] mb-2 block",

    error: {
        border: "border-red-500 focus:border-red-600",
        text: "text-xs text-red-600 font-semibold mt-1",
    },
} as const;

// ============================================================================
// LINK STYLES
// ============================================================================

export const linkStyles = {
    // Inline Links (in body text)
    inline: "text-orange-600 font-semibold underline decoration-orange-300 decoration-2 underline-offset-4 hover:text-orange-700 hover:decoration-orange-500 transition-colors duration-200",

    // Navigation Links (sidebar, header)
    nav: "text-slate-400 font-bold hover:text-orange-500 transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-orange-500 hover:after:w-full after:transition-all after:duration-300",

    // External Links (with icon)
    external: "inline-flex items-center gap-1 text-orange-600 font-semibold hover:text-orange-700 transition-colors",
} as const;

// ============================================================================
// CARD VARIANTS
// ============================================================================

export const cardVariants = {
    base: "bg-white rounded-2xl border border-slate-200 shadow-sm p-6",

    interactive: "bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-xl hover:border-orange-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer",

    elevated: "bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-900/5 p-6",
} as const;

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const transitions = {
    // Interactive Elements (Buttons, Links, Cards)
    interactive: "hover:scale-[1.02] hover:shadow-lg transition-all duration-300 ease-out",

    // Icon Animations
    icon: "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12",

    // Background/Color Changes
    color: "transition-colors duration-200 ease-out",

    // Layout Shifts
    layout: "transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)",

    // Active States
    active: "active:scale-[0.98] active:brightness-95",
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",

    // Colored Shadows
    primaryButton: "shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50",
    dangerButton: "shadow-lg shadow-red-500/30 hover:shadow-red-500/50",
    successButton: "shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50",
} as const;
