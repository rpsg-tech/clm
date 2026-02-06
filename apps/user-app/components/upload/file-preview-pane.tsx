import React from 'react';

interface FilePreviewPaneProps {
    fileUrl: string | null;
    fileName?: string;
}

export const FilePreviewPane: React.FC<FilePreviewPaneProps> = ({ fileUrl, fileName }) => {
    if (!fileUrl) {
        return (
            <div className="flex h-full items-center justify-center bg-slate-50 text-slate-400 text-sm">
                No file selected
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-900 border-r border-slate-700">
            {/* Simple Toolbar */}
            <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-700">
                <span className="font-mono truncate max-w-[200px]">{fileName || 'Document'}</span>
                <span className="bg-slate-700 px-2 py-0.5 rounded text-[10px] uppercase">Read Only</span>
            </div>

            {/* Viewer */}
            <iframe
                src={fileUrl}
                className="flex-1 w-full h-full bg-slate-200"
                title="Document Preview"
            />
        </div>
    );
};
