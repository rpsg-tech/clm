
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SplitViewEditor } from '@/components/split-view-editor';
import { api } from '@/lib/api-client';

export default function DraftingWorkspacePage() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get('templateId');
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(!!templateId);

    useEffect(() => {
        if (templateId) {
            api.templates.get(templateId)
                .then(res => setTemplate((res as any).data))
                .catch(err => console.error("Failed to load template", err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [templateId]);

    if (!templateId) {
        return <div className="p-8 text-center text-red-500">Invalid Session: No Template Selected</div>;
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <span className="ml-4 text-slate-500">Preparing Workspace...</span>
            </div>
        );
    }

    return <SplitViewEditor templateId={templateId} template={template} />;
}
