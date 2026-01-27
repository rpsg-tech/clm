/**
 * HTML Sanitization Utility
 * 
 * Provides server-side HTML sanitization for user-generated content.
 * Uses sanitize-html (clean, no jsdom dependency).
 */

import * as sanitizeHtmlLib from 'sanitize-html';

/**
 * Allowed HTML tags for contract content
 */
const CONTRACT_ALLOWED_TAGS = [
    // Structure
    'div', 'span', 'p', 'br', 'hr',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Text formatting
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'sub', 'sup',
    // Lists
    'ul', 'ol', 'li',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Other safe elements
    'blockquote', 'pre', 'code', 'a', 'img',
];

/**
 * Allowed HTML attributes (Applied globally to all tags or specific ones)
 */
const CONTRACT_ALLOWED_ATTR = {
    '*': ['class', 'id', 'style', 'data-*'],
    'a': ['href', 'target', 'rel', 'name'],
    'img': ['src', 'alt', 'width', 'height', 'title'],
    'table': ['border', 'cellpadding', 'cellspacing'],
    'th': ['scope', 'colspan', 'rowspan'],
    'td': ['scope', 'colspan', 'rowspan'],
};

/**
 * Sanitization options for different contexts
 */
export const SanitizeConfig = {
    /**
     * Strict: For contract annexure content
     * Allows formatting and structure, removes all scripts and dangerous content
     */
    CONTRACT_CONTENT: {
        allowedTags: CONTRACT_ALLOWED_TAGS,
        allowedAttributes: CONTRACT_ALLOWED_ATTR,
        allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'tel'],
        allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
        allowProtocolRelative: false,
        enforceHtmlBoundary: false,
    } as sanitizeHtmlLib.IOptions,

    /**
     * Minimal: For plain text fields that shouldn't have any HTML
     */
    PLAIN_TEXT: {
        allowedTags: [],
        allowedAttributes: {},
    } as sanitizeHtmlLib.IOptions,

    /**
     * Rich Text: For user comments and descriptions
     */
    RICH_TEXT: {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        allowedAttributes: {
            'a': ['href', 'target'],
        },
    } as sanitizeHtmlLib.IOptions,
};

/**
 * Sanitize HTML content for safe storage and rendering
 * 
 * @param dirty - Untrusted HTML string
 * @param config - Sanitization configuration (defaults to CONTRACT_CONTENT)
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(
    dirty: string,
    config: sanitizeHtmlLib.IOptions = SanitizeConfig.CONTRACT_CONTENT,
): string {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    return sanitizeHtmlLib.default(dirty, config);
}

/**
 * Sanitize contract annexure data
 */
export function sanitizeContractContent(content: string): string {
    return sanitizeHtml(content, SanitizeConfig.CONTRACT_CONTENT);
}

/**
 * Strip all HTML and return plain text
 */
export function stripHtml(html: string): string {
    return sanitizeHtml(html, SanitizeConfig.PLAIN_TEXT);
}

/**
 * Sanitize rich text content (comments, descriptions)
 */
export function sanitizeRichText(content: string): string {
    return sanitizeHtml(content, SanitizeConfig.RICH_TEXT);
}

/**
 * Check if string contains potentially dangerous content
 */
export function containsDangerousContent(html: string): boolean {
    if (!html) return false;

    const dangerous = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,  // Event handlers
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /vbscript:/i,
        /data:/i,  // Data URIs (except images if we wanted to allow them, but stricter is better)
    ];

    return dangerous.some(pattern => pattern.test(html));
}
