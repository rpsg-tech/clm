import React from 'react';

interface DualPaneLayoutProps {
    header: React.ReactNode;
    leftPane: React.ReactNode;
    rightPane: React.ReactNode;
    sidebar?: React.ReactNode;
    isPreviewMode?: boolean;
    previewContent?: React.ReactNode;
}

export const DualPaneLayout: React.FC<DualPaneLayoutProps> = ({
    header,
    leftPane,
    rightPane,
    sidebar,
    isPreviewMode = false,
    previewContent
}) => {
    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100">
            {/* Header / Toolbar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm z-10">
                {header}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative flex">

                {/* Optional Sidebar (Far Left) */}
                {sidebar && (
                    <div className="w-[280px] border-r border-slate-200 bg-white h-full overflow-hidden shrink-0 z-10 hidden md:block">
                        {sidebar}
                    </div>
                )}

                <div className="flex-1 min-w-0 relative">
                    {isPreviewMode ? (
                        /* Unified Preview Mode Container */
                        <div className="h-full overflow-y-auto bg-slate-100 p-8 flex justify-center relative">
                            <div className="max-w-4xl w-full bg-white shadow-lg min-h-screen p-12">
                                {previewContent}
                            </div>
                        </div>
                    ) : (
                        /* Split View Mode */
                        <div className={`grid h-full ${sidebar ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2'}`}>
                            {/* Left Pane (Editor/Preview) */}
                            <div className="h-full border-r border-slate-200 overflow-hidden bg-slate-50/50 relative">
                                {leftPane}
                            </div>

                            {/* Right Pane (Form/Assistant) */}
                            <div className="h-full overflow-hidden bg-white relative">
                                {rightPane}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
