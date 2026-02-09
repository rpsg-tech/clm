'use client';

import { MaterialIcon } from '@/components/ui/material-icon';

interface PartAPreviewStepProps {
    templateContent: string;
    templateName: string;
}

export function PartAPreviewStep({ templateContent, templateName }: PartAPreviewStepProps) {
    return (
        <div className="space-y-6">
            <div className="rounded-lg bg-neutral-200/60 border border-neutral-300 p-4 flex items-start gap-3">
                <div className="p-1.5 bg-neutral-200 rounded-md text-neutral-600">
                    <MaterialIcon name="lock" size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-800">Read-Only: Standard Terms</p>
                    <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                        This section contains standard legal terms approved by Legal. These cannot be edited.
                        You will be able to modify Annexures in the next step.
                    </p>
                </div>
            </div>

            <div className="relative">
                <div className="bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-neutral-200 min-h-[600px] max-w-[850px] mx-auto relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-10 select-none">
                        <div className="-rotate-45 text-neutral-50 text-[100px] font-black tracking-widest uppercase border-[6px] border-neutral-50 p-12 rounded-2xl opacity-80">
                            Standard Terms
                        </div>
                    </div>
                    <div className="relative z-20 font-serif p-12 md:p-16 space-y-8 leading-loose text-[15px] text-justify text-neutral-800">
                        <div className="text-xs uppercase tracking-[0.3em] text-neutral-400 font-semibold">
                            {templateName}
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: templateContent }} />
                    </div>
                </div>
                <div className="h-32 bg-gradient-to-b from-transparent to-white w-full mt-4" />
            </div>
        </div>
    );
}
