'use client';

import { useMemo, useEffect } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';

interface FilePreviewProps {
    file?: File | null;
    url?: string;
    filename?: string;
    className?: string;
}

function getFileType(file?: File | null, filename?: string): 'pdf' | 'image' | 'other' {
    const name = file?.name ?? filename ?? '';
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
    return 'other';
}

export function FilePreview({ file, url, filename, className = '' }: FilePreviewProps) {
    const blobUrl = useMemo(() => {
        if (file) return URL.createObjectURL(file);
        return null;
    }, [file]);

    useEffect(() => {
        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [blobUrl]);

    const src = blobUrl ?? url;
    const fileType = getFileType(file, filename);
    const displayName = file?.name ?? filename ?? 'Document';

    if (!src) {
        return (
            <div className={`flex items-center justify-center h-full bg-neutral-50 rounded-xl border border-neutral-200 ${className}`}>
                <div className="text-center">
                    <MaterialIcon name="description" size={40} className="text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">No file selected</p>
                </div>
            </div>
        );
    }

    if (fileType === 'pdf') {
        return (
            <div className={`relative h-full ${className}`}>
                <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 border border-neutral-200 text-xs font-medium text-neutral-600 shadow-sm">
                        <MaterialIcon name="picture_as_pdf" size={14} className="text-red-500" />
                        Original File
                    </span>
                </div>
                <iframe
                    src={src}
                    className="w-full h-full rounded-xl border border-neutral-200"
                    title={displayName}
                />
            </div>
        );
    }

    if (fileType === 'image') {
        return (
            <div className={`relative h-full flex items-center justify-center bg-neutral-50 rounded-xl border border-neutral-200 p-4 ${className}`}>
                <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 border border-neutral-200 text-xs font-medium text-neutral-600 shadow-sm">
                        <MaterialIcon name="image" size={14} className="text-blue-500" />
                        Original File
                    </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={displayName} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center h-full bg-neutral-50 rounded-xl border border-neutral-200 ${className}`}>
            <div className="text-center p-8">
                <div className="size-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                    <MaterialIcon name="article" size={32} className="text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-neutral-900 mb-1">{displayName}</p>
                <p className="text-xs text-neutral-500">
                    Preview is not available for this file type.
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                    The document will be analyzed after upload.
                </p>
            </div>
        </div>
    );
}
