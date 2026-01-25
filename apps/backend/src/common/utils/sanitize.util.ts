/**
 * HTML Sanitization Utility
 * 
 * Provides server-side HTML sanitization for user-generated content.
 * Uses DOMPurify with jsdom for Node.js environment.
 */

import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// Create a virtual DOM window for DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window);

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
 * Allowed HTML attributes
 */
const CONTRACT_ALLOWED_ATTR = [
    // General
    'class', 'id', 'style',
    // Links
    'href', 'target', 'rel',
    // Images
    'src', 'alt', 'width', 'height',
    // Tables
    'colspan', 'rowspan', 'scope',
    // Data attributes
    'data-*',
];

/**
 * Sanitization options for different contexts
 */
export const SanitizeConfig = {
    /**
     * Strict: For contract annexure content
     * Allows formatting and structure, removes all scripts and dangerous content
     */
    CONTRACT_CONTENT: {
        ALLOWED_TAGS: CONTRACT_ALLOWED_TAGS,
        ALLOWED_ATTR: CONTRACT_ALLOWED_ATTR,
        ALLOW_DATA_ATTR: true,
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
        ADD_ATTR: ['target'],
        // Force all links to open in new tab for security
        ADD_TAGS: [],
        KEEP_CONTENT: true,
        // Allow safe URI schemes only
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    },

    /**
     * Minimal: For plain text fields that shouldn't have any HTML
     */
    PLAIN_TEXT: {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    },

    /**
     * Rich Text: For user comments and descriptions
     */
    RICH_TEXT: {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target'],
        ALLOW_DATA_ATTR: false,
    },
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
    config: DOMPurify.Config = SanitizeConfig.CONTRACT_CONTENT,
): string {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }

    // Sanitize the HTML
    const clean = purify.sanitize(dirty, config);

    return clean;
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
        /data:/i,  // Data URIs
    ];

    return dangerous.some(pattern => pattern.test(html));
}
