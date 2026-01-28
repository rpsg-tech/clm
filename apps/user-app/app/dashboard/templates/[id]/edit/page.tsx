'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TemplateBuilder } from '@/components/templates/template-builder';
import { api } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

export default function EditTemplatePage() {
    const params = useParams();
    const [template, setTemplate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                if (params.id) {
                    const data = await api.templates.get(params.id as string);
                    setTemplate(data);
                }
            } catch (error) {
                console.error('Failed to fetch template', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplate();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!template) {
        return <div>Template not found</div>;
    }

    return <TemplateBuilder mode="edit" initialData={template} />;
}
