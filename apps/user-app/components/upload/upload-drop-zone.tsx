import React, { useCallback, useState } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';

interface UploadDropZoneProps {
    onFileSelect: (file: File) => void;
    isLoading?: boolean;
}

export const UploadDropZone: React.FC<UploadDropZoneProps> = ({ onFileSelect, isLoading }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
            e.target.value = ''; // Reset
        }
    }, [onFileSelect]);

    return (
        <div
            className={`
                group relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer h-full min-h-[160px]
                ${isDragging
                    ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                    : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
                }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('upload-input')?.click()}
        >
            <input
                id="upload-input"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={handleChange}
                disabled={isLoading}
            />

            {isLoading ? (
                <div className="flex flex-col items-center gap-3 animate-pulse">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-sm font-medium text-indigo-600">Processing...</p>
                </div>
            ) : (
                <>
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors
                        ${isDragging ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-500'}
                    `}>
                        <UploadCloud className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 group-hover:text-indigo-700">
                        Import Third-Party Paper
                    </h3>
                    <p className="text-xs text-slate-400 text-center mt-2 px-4">
                        Drag & drop your PDF or Word doc here to start the extraction process.
                    </p>
                </>
            )}
        </div>
    );
};
