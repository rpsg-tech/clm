"use client";

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Table } from 'lucide-react';

interface TableBuilderProps {
    editor: Editor;
    onClose: () => void;
}

export function TableBuilder({ editor, onClose }: TableBuilderProps) {
    const [hoveredCell, setHoveredCell] = useState({ row: 3, col: 3 });
    const maxRows = 8;
    const maxCols = 8;

    const handleCellHover = (row: number, col: number) => {
        setHoveredCell({ row, col });
    };

    const handleInsertTable = () => {
        editor
            .chain()
            .focus()
            .insertTable({
                rows: hoveredCell.row,
                cols: hoveredCell.col,
                withHeaderRow: true,
            })
            .run();
        onClose();
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                <Table size={16} className="text-orange-500" />
                <span className="text-sm font-semibold text-slate-700">Insert Table</span>
            </div>

            {/* Grid Selector */}
            <div className="mb-2">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
                    {Array.from({ length: maxRows * maxCols }).map((_, index) => {
                        const row = Math.floor(index / maxCols) + 1;
                        const col = (index % maxCols) + 1;
                        const isHighlighted = row <= hoveredCell.row && col <= hoveredCell.col;

                        return (
                            <div
                                key={index}
                                className={`w-6 h-6 border-2 rounded transition-all cursor-pointer ${isHighlighted
                                        ? 'bg-orange-100 border-orange-400'
                                        : 'bg-white border-slate-200 hover:border-orange-300'
                                    }`}
                                onMouseEnter={() => handleCellHover(row, col)}
                                onClick={handleInsertTable}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Size Label */}
            <div className="text-center text-sm font-medium text-slate-600 mb-2">
                {hoveredCell.row} × {hoveredCell.col} table
            </div>

            {/* Insert Button */}
            <button
                onClick={handleInsertTable}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
                Insert Table
            </button>
        </div>
    );
}
