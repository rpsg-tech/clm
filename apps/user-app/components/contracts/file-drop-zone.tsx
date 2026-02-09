'use client';

import { useCallback, useRef, useState } from 'react';
import { MaterialIcon } from '@/components/ui/material-icon';
import { useToast } from '@/lib/toast-context';

interface FileDropZoneProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    file?: File | null;
    onClear?: () => void;
    disabled?: boolean;
    compact?: boolean;
    className?: string;
}

const DEFAULT_ACCEPT = '.pdf,.doc,.docx,.png,.jpg,.jpeg';

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropZone({
    onFileSelect,
    accept = DEFAULT_ACCEPT,
    maxSizeMB = 25,
    file,
    onClear,
    disabled = false,
    compact = false,
    className = '',
}: FileDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { error: showError } = useToast();

    const acceptedExtensions = accept.split(',').map((e) => e.trim().toLowerCase());

    function validateFile(f: File): boolean {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase();
        if (!acceptedExtensions.includes(ext)) {
            showError('Invalid File', `Accepted formats: ${acceptedExtensions.join(', ')}`);
            return false;
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
            showError('File Too Large', `Maximum file size is ${maxSizeMB} MB`);
            return false;
        }
        return true;
    }

    function handleFile(f: File) {
        if (validateFile(f)) {
            onFileSelect(f);
        }
    }

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
        },
        [disabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (disabled) return;
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
        },
        [disabled]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
            }
        },
        [disabled]
    );

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            if (inputRef.current) inputRef.current.value = '';
        },
        []
    );

    if (file) {
        return (
            <div
                className={`rounded-xl border border-neutral-200 bg-white p-${compact ? '4' : '6'} ${className}`}
            >
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <MaterialIcon
                            name={file.type === 'application/pdf' ? 'picture_as_pdf' : 'description'}
                            size={24}
                            className="text-indigo-600"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{formatFileSize(file.size)}</p>
                    </div>
                    {onClear && (
                        <button
                            onClick={onClear}
                            aria-label="Remove file"
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            <MaterialIcon name="close" size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && inputRef.current?.click()}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-dropeffect={disabled ? 'none' : 'copy'}
            aria-label="Upload a document by dragging and dropping or browsing files"
            className={`
                rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                ${isDragging ? 'border-indigo-400 bg-indigo-50/50' : 'border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 hover:bg-neutral-50'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${compact ? 'p-6' : 'p-12'}
                ${className}
            `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleInputChange}
                className="hidden"
            />
            <div className="flex flex-col items-center text-center">
                <div
                    className={`rounded-xl flex items-center justify-center mb-3 ${
                        isDragging ? 'bg-indigo-100' : 'bg-neutral-100'
                    } ${compact ? 'size-10' : 'size-14'}`}
                >
                    <MaterialIcon
                        name="cloud_upload"
                        size={compact ? 20 : 28}
                        className={isDragging ? 'text-indigo-600' : 'text-neutral-400'}
                    />
                </div>
                <p className={`font-medium text-neutral-700 ${compact ? 'text-sm' : 'text-base'}`}>
                    {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                    or <span className="text-indigo-600 font-medium">browse files</span>
                </p>
                <p className="text-xs text-neutral-400 mt-2">
                    PDF, Word, or Image up to {maxSizeMB} MB
                </p>
            </div>
        </div>
    );
}
