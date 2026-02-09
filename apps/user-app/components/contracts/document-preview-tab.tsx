'use client';

import { MaterialIcon } from '@/components/ui/material-icon';
import { Badge } from '@repo/ui';
import DOMPurify from 'isomorphic-dompurify';

interface Contract {
    version?: string;
    content?: string;
    title?: string;
}

interface DocumentPreviewTabProps {
    contract: Contract;
}

export function DocumentPreviewTab({ contract }: DocumentPreviewTabProps) {
    const version = contract?.version || 'N/A';
    const content = contract?.content;

    // Sanitize HTML content to prevent XSS attacks
    const sanitizedContent = content ? DOMPurify.sanitize(content) : null;

    return (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MaterialIcon name="description" size={20} className="text-primary-600" />
                    <h3 className="text-base font-bold text-neutral-900">
                        Document Preview — v{version}
                    </h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                    Read only
                </Badge>
            </div>

            {/* Content */}
            <div className="p-8 max-w-4xl mx-auto">
                {sanitizedContent ? (
                    <div
                        className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-lg prose-p:text-neutral-700 prose-p:leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />
                ) : (
                    <div className="text-center py-20">
                        <div className="size-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MaterialIcon name="draft" size={32} className="text-neutral-400" />
                        </div>
                        <h4 className="text-base font-medium text-neutral-900 mb-2">
                            No document content available yet
                        </h4>
                        <p className="text-sm text-neutral-500">
                            Upload a document or create content to preview it here.
                        </p>
                    </div>
                )}
            </div>

            {/* Floating Ask Oracle Button */}
            {sanitizedContent && (
                <div className="fixed bottom-8 right-8 z-50">
                    <button
                        className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full shadow-lg shadow-violet-600/30 transition-all active:scale-95"
                        onClick={() => {
                            // TODO: Implement Ask Oracle functionality
                            console.warn('Ask Oracle clicked');
                        }}
                    >
                        <MaterialIcon name="auto_awesome" size={20} />
                        Ask Oracle
                    </button>
                </div>
            )}
        </div>
    );
}
