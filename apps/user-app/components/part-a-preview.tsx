
import React from 'react';
import { Card } from '@repo/ui';
import { MaterialIcon } from '@/components/ui/material-icon';

interface PartAPreviewProps {
    content: string;
}

export const PartAPreview: React.FC<PartAPreviewProps> = ({ content }) => {
    return (
        <div className="h-full flex flex-col bg-slate-50 border-r border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700">
                    <MaterialIcon name="lock" className="w-4 h-4" />
                    <span className="font-semibold text-sm uppercase tracking-wide">Main Agreement (Part A)</span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Read Only</span>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <Card className="min-h-full p-8 shadow-sm border-slate-200 bg-white">
                    <div
                        className="prose prose-sm max-w-none text-slate-800 font-serif"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </Card>
            </div>
        </div>
    );
};
