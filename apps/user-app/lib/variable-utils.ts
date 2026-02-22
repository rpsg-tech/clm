/**
 * Variable Utilities for Template Variable System
 *
 * Variables use {{VARIABLE_NAME}} syntax (uppercase, underscores).
 * These utilities handle extraction, substitution, and schema building.
 */

export interface VariableField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea';
    required: boolean;
    placeholder: string;
    source: 'main' | 'annexure';
    sourceLabel: string;
}

const VAR_REGEX = /\{\{([A-Z0-9_]+)\}\}/g;

/**
 * Extract all unique {{VARIABLE_NAME}} keys from HTML content.
 */
export function extractVariableKeys(html: string): string[] {
    const keys: string[] = [];
    const regex = new RegExp(VAR_REGEX.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
        if (!keys.includes(match[1])) {
            keys.push(match[1]);
        }
    }
    return keys;
}

/**
 * Convert SNAKE_CASE key to human-readable label.
 */
export function keyToLabel(key: string): string {
    return key
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Apply variable values to HTML content.
 * - If highlight=true: unfilled variables get an orange highlight span
 * - If highlight=false: unfilled variables are left as-is (or replaced with empty string)
 */
export function applyVariables(
    html: string,
    values: Record<string, string>,
    options: { highlight?: boolean; emptyFallback?: string } = {}
): string {
    const { highlight = false, emptyFallback = '' } = options;

    return html.replace(new RegExp(VAR_REGEX.source, 'g'), (match, key) => {
        const value = values[key];
        if (value && value.trim()) {
            return `<span class="template-var-filled" data-var="${key}">${value}</span>`;
        }
        if (highlight) {
            return `<span class="template-var-empty" data-var="${key}" style="background: #FEF3C7; color: #92400E; padding: 0 4px; border-radius: 3px; border: 1px dashed #F59E0B; font-style: italic;">${keyToLabel(key)}</span>`;
        }
        return emptyFallback || match;
    });
}

/**
 * Apply variable values to HTML content for final output (no spans, just plain text).
 */
export function applyVariablesFinal(html: string, values: Record<string, string>): string {
    return html.replace(new RegExp(VAR_REGEX.source, 'g'), (match, key) => {
        const value = values[key];
        return value && value.trim() ? value : match;
    });
}

/**
 * Check if all required variables have been filled.
 */
export function validateVariables(
    fields: VariableField[],
    values: Record<string, string>
): { valid: boolean; missing: string[] } {
    const missing = fields
        .filter(f => f.required && (!values[f.key] || !values[f.key].trim()))
        .map(f => f.label);
    return { valid: missing.length === 0, missing };
}

/**
 * Count how many variables are filled.
 */
export function countFilled(fields: VariableField[], values: Record<string, string>): number {
    return fields.filter(f => values[f.key] && values[f.key].trim()).length;
}
