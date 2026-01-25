/**
 * SafeHtml Component
 * 
 * Safely renders HTML content using DOMPurify to prevent XSS attacks.
 * Use this instead of dangerouslySetInnerHTML directly.
 */
import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
    html: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

export const SafeHtml: React.FC<SafeHtmlProps> = ({
    html,
    className = '',
    as: Component = 'div'
}) => {
    // Sanitize HTML on the client side before rendering
    // We expect backend to sanitize too, but defense-in-depth is critical
    const sanitizedHtml = DOMPurify.sanitize(html, {
        ADD_ATTR: ['target'], // Allow target="_blank"
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });

    return (
        <Component
            className={className}
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
    );
};
