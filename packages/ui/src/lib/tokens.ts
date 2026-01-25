/**
 * Design System Tokens
 * 
 * HSL-based color palette with dark mode support.
 * These values should be used in tailwind.config.ts
 */

export const colors = {
    // Brand Colors
    primary: {
        DEFAULT: "hsl(24, 95%, 53%)",      // Orange-500
        50: "hsl(33, 100%, 96%)",
        100: "hsl(34, 100%, 92%)",
        200: "hsl(32, 98%, 83%)",
        300: "hsl(31, 97%, 72%)",
        400: "hsl(27, 96%, 61%)",
        500: "hsl(24, 95%, 53%)",
        600: "hsl(21, 90%, 48%)",
        700: "hsl(17, 88%, 40%)",
        800: "hsl(15, 79%, 34%)",
        900: "hsl(15, 75%, 28%)",
        950: "hsl(13, 81%, 15%)",
    },

    // Neutral / Gray
    neutral: {
        50: "hsl(0, 0%, 98%)",
        100: "hsl(0, 0%, 96%)",
        200: "hsl(0, 0%, 90%)",
        300: "hsl(0, 0%, 83%)",
        400: "hsl(0, 0%, 64%)",
        500: "hsl(0, 0%, 45%)",
        600: "hsl(0, 0%, 32%)",
        700: "hsl(0, 0%, 25%)",
        800: "hsl(0, 0%, 15%)",
        900: "hsl(0, 0%, 9%)",
        950: "hsl(0, 0%, 4%)",
    },

    // Semantic Colors
    success: {
        DEFAULT: "hsl(142, 71%, 45%)",
        light: "hsl(142, 76%, 94%)",
        dark: "hsl(142, 71%, 35%)",
    },
    warning: {
        DEFAULT: "hsl(45, 93%, 47%)",
        light: "hsl(45, 100%, 94%)",
        dark: "hsl(45, 93%, 37%)",
    },
    error: {
        DEFAULT: "hsl(0, 84%, 60%)",
        light: "hsl(0, 86%, 94%)",
        dark: "hsl(0, 84%, 50%)",
    },
    info: {
        DEFAULT: "hsl(217, 91%, 60%)",
        light: "hsl(217, 100%, 94%)",
        dark: "hsl(217, 91%, 50%)",
    },
};

export const spacing = {
    xs: "0.25rem",    // 4px
    sm: "0.5rem",     // 8px
    md: "1rem",       // 16px
    lg: "1.5rem",     // 24px
    xl: "2rem",       // 32px
    "2xl": "3rem",    // 48px
    "3xl": "4rem",    // 64px
};

export const typography = {
    fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
    },
    fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
    },
};

export const shadows = {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
};

export const borderRadius = {
    none: "0",
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
};

export const animation = {
    durations: {
        fast: "150ms",
        normal: "200ms",
        slow: "300ms",
        slower: "500ms",
    },
    easings: {
        default: "cubic-bezier(0.4, 0, 0.2, 1)",
        linear: "linear",
        in: "cubic-bezier(0.4, 0, 1, 1)",
        out: "cubic-bezier(0, 0, 0.2, 1)",
        inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
};

export const breakpoints = {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
};
