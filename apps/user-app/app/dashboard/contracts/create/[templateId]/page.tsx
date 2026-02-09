'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { CreationWizard } from '@/components/contracts/creation-wizard';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Skeleton } from '@repo/ui';
import type { Annexure, TemplateWithAnnexures } from '@repo/types';

interface PageProps {
    params: Promise<{ templateId: string }>;
}

export default function CreateFromTemplatePage({ params }: PageProps) {
    const { templateId } = use(params);

    const { data: template, isLoading, error } = useQuery({
        queryKey: ['template', templateId],
        queryFn: () => api.templates.get(templateId),
        staleTime: 60000,
    });

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <div className="space-y-4 mt-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="max-w-md mx-auto text-center py-16">
                <MaterialIcon name="error_outline" size={48} className="text-red-400 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-neutral-900 mb-2">Template Not Found</h2>
                <p className="text-sm text-neutral-500 mb-6">
                    The selected template could not be loaded. It may have been deactivated or removed.
                </p>
                <Link
                    href="/dashboard/contracts/create"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:text-primary-800"
                >
                    <MaterialIcon name="arrow_back" size={16} />
                    Back to Templates
                </Link>
            </div>
        );
    }

    const templateData = template as TemplateWithAnnexures;
    const combinedAnnexures = (templateData.annexures || [])
        .sort((a: Annexure, b: Annexure) => a.order - b.order)
        .map((ann: Annexure) => `<h2>${ann.title}</h2>\n${ann.content}`)
        .join('\n<hr />\n');

    return (
        <div>
            {/* Back link */}
            <Link
                href="/dashboard/contracts/create"
                className="inline-flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800 font-medium mb-6"
            >
                <MaterialIcon name="arrow_back" size={16} />
                Back to Templates
            </Link>

            {/* Title */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    New {templateData.name || 'Agreement'}
                </h1>
                <p className="mt-1 text-sm text-neutral-500">
                    {templateData.description || 'Complete the steps below to create your contract.'}
                </p>
            </div>

            {/* Wizard */}
            <CreationWizard
                templateId={templateId}
                templateName={templateData.name || 'Template'}
                templateContent={templateData.baseContent || ''}
                templateAnnexures={combinedAnnexures}
            />
        </div>
    );
}
