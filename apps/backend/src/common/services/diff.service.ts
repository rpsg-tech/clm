import { Injectable } from '@nestjs/common';
import * as DiffLib from 'diff';

// Handle ESM/CJS interop for diff library
const Diff = (DiffLib as any).default || DiffLib;

import * as crypto from 'crypto';

export interface Hunk {
    sectionTitle?: string;
    oldStart: number;
    newStart: number;
    oldLines: number;
    newLines: number;
    lines: Array<{
        type: 'added' | 'removed' | 'context';
        content: string;
        lineNumber?: number;
    }>;
}

export interface ChangeHunkResult {
    hunks: Hunk[];
    stats: {
        additions: number;
        deletions: number;
        total: number;
    };
    contentHash: string;
}

export interface FieldChange {
    field: string;
    label: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'modified' | 'removed';
}

export interface ContentDiff {
    changeType: 'content_modified' | 'no_change';
    diffStats?: {
        additions: number;
        deletions: number;
        modifications: number;
    };
    htmlDiff?: string;
}

export interface ChangeLog {
    summary: string;
    changeCount: number;
    changes: (FieldChange | ContentDiff)[];
    createdBy: string;
    notes?: string;
}

@Injectable()
export class DiffService {
    /**
     * Calculate changes between two versions
     */
    /**
     * Calculate changes between two versions (Non-blocking)
     */
    async calculateChanges(
        previousData: Record<string, any> | null,
        currentData: Record<string, any>,
        userEmail: string,
    ): Promise<ChangeLog> {
        return new Promise((resolve) => {
            setImmediate(() => {
                if (!previousData) {
                    resolve({
                        summary: 'Initial version created',
                        changeCount: 0,
                        changes: [],
                        createdBy: userEmail,
                    });
                    return;
                }

                const changes: (FieldChange | ContentDiff)[] = [];
                const fieldChanges: FieldChange[] = [];

                // Define fields to track
                const trackedFields = {
                    title: 'Contract Title',
                    counterpartyName: 'Counterparty Name',
                    counterpartyEmail: 'Counterparty Email',
                    startDate: 'Start Date',
                    endDate: 'End Date',
                    value: 'Contract Value',
                };

                // Check field changes
                for (const [field, label] of Object.entries(trackedFields)) {
                    const oldValue = previousData[field];
                    const newValue = currentData[field];

                    if (oldValue !== newValue) {
                        let changeType: 'added' | 'modified' | 'removed' = 'modified';

                        if (oldValue === null || oldValue === undefined) {
                            changeType = 'added';
                        } else if (newValue === null || newValue === undefined) {
                            changeType = 'removed';
                        }

                        fieldChanges.push({
                            field,
                            label,
                            oldValue: this.formatValue(oldValue),
                            newValue: this.formatValue(newValue),
                            changeType,
                        });
                    }
                }

                changes.push(...fieldChanges);

                // Check main content changes
                const oldMain = previousData.content || '';
                const newMain = currentData.content || '';

                if (oldMain !== newMain) {
                    const mainDiff = this.calculateContentDiff(oldMain, newMain);
                    changes.push({
                        ...mainDiff,
                        changeType: 'content_modified',
                    } as any); // Type cast for simplicity or update interface
                }

                // Check annexure changes
                const oldAnnexures = previousData.annexureData || '';
                const newAnnexures = currentData.annexureData || '';

                if (oldAnnexures !== newAnnexures) {
                    const annexureDiff = this.calculateContentDiff(oldAnnexures, newAnnexures);
                    changes.push({
                        ...annexureDiff,
                        changeType: 'content_modified',
                    } as any);
                }

                // Generate summary
                const summary = this.generateSummary(fieldChanges, changes);

                resolve({
                    summary,
                    changeCount: changes.length,
                    changes,
                    createdBy: userEmail,
                });
            });
        });
    }

    /**
     * Calculate detailed content diff
     */
    private calculateContentDiff(oldContent: string, newContent: string): ContentDiff {
        // Strip HTML for text comparison
        const oldText = this.stripHtml(oldContent);
        const newText = this.stripHtml(newContent);

        if (oldText === newText) {
            return { changeType: 'no_change' };
        }

        const diff = Diff.diffLines(oldText, newText);

        let additions = 0;
        let deletions = 0;

        diff.forEach((part) => {
            const lines = part.value.split('\n').filter(l => l.length > 0).length;
            if (part.added) {
                additions += lines;
            } else if (part.removed) {
                deletions += lines;
            }
        });

        return {
            changeType: 'content_modified',
            diffStats: {
                additions,
                deletions,
                modifications: Math.min(additions, deletions),
            },
        };
    }

    /**
     * Generate HTML diff for visual display
     */
    generateHtmlDiff(oldContent: string, newContent: string): string {
        const diff = Diff.diffWords(oldContent, newContent);

        let html = '<div class="diff-content">';

        diff.forEach((part) => {
            const value = this.escapeHtml(part.value);
            if (part.added) {
                html += `<span class="diff-added">${value}</span>`;
            } else if (part.removed) {
                html += `<span class="diff-removed">${value}</span>`;
            } else {
                html += `<span>${value}</span>`;
            }
        });

        html += '</div>';
        return html;
    }

    /**
     * Compare two versions and return detailed diff
     */
    compareVersions(
        fromVersion: Record<string, any>,
        toVersion: Record<string, any>,
    ): {
        fieldChanges: FieldChange[];
        mainDiff: ContentDiff & { htmlDiff?: string };
        annexureDiff: ContentDiff & { htmlDiff?: string };
    } {
        const fieldChanges: FieldChange[] = [];

        const trackedFields = {
            title: 'Contract Title',
            counterpartyName: 'Counterparty Name',
            counterpartyEmail: 'Counterparty Email',
            startDate: 'Start Date',
            endDate: 'End Date',
            value: 'Contract Value',
            status: 'Status',
        };

        // Compare all fields
        for (const [field, label] of Object.entries(trackedFields)) {
            const fromValue = fromVersion[field];
            const toValue = toVersion[field];

            if (fromValue !== toValue) {
                let changeType: 'added' | 'modified' | 'removed' = 'modified';

                if (fromValue === null || fromValue === undefined) {
                    changeType = 'added';
                } else if (toValue === null || toValue === undefined) {
                    changeType = 'removed';
                }

                fieldChanges.push({
                    field,
                    label,
                    oldValue: this.formatValue(fromValue),
                    newValue: this.formatValue(toValue),
                    changeType,
                });
            }
        }

        // Content diff for Main Agreement
        const fromMain = fromVersion.content || '';
        const toMain = toVersion.content || '';
        const mainDiff = this.calculateContentDiff(fromMain, toMain);
        const mainHtml = this.generateHtmlDiff(fromMain, toMain);

        // Content diff for Annexures
        const fromAnnex = fromVersion.annexureData || '';
        const toAnnex = toVersion.annexureData || '';
        const annexureDiff = this.calculateContentDiff(fromAnnex, toAnnex);
        const annexureHtml = this.generateHtmlDiff(fromAnnex, toAnnex);

        return {
            fieldChanges,
            mainDiff: {
                ...mainDiff,
                htmlDiff: mainHtml,
            },
            annexureDiff: {
                ...annexureDiff,
                htmlDiff: annexureHtml,
            },
        };
    }

    /**
     * Generate human-readable summary
     */
    private generateSummary(fieldChanges: FieldChange[], allChanges: any[]): string {
        if (allChanges.length === 0) {
            return 'No changes made';
        }

        if (fieldChanges.length === 0 && allChanges.length === 1) {
            return 'Content updated';
        }

        const fieldNames = fieldChanges.map((c) => c.label.toLowerCase());

        if (fieldNames.length === 1) {
            return `Updated ${fieldNames[0]}`;
        }

        if (fieldNames.length === 2) {
            return `Updated ${fieldNames[0]} and ${fieldNames[1]}`;
        }

        if (fieldNames.length > 2) {
            const first = fieldNames.slice(0, 2).join(', ');
            const remaining = fieldNames.length - 2;
            return `Updated ${first} and ${remaining} other ${remaining === 1 ? 'field' : 'fields'}`;
        }

        return `${allChanges.length} changes made`;
    }

    /**
     * Format value for display
     */
    private formatValue(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }

        if (value instanceof Date) {
            return value.toLocaleDateString();
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
    }

    /**
     * Strip HTML tags
     */
    private stripHtml(html: string): string {
        if (!html) return '';
        let text = html.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<\/p>/gi, '\n');
        text = text.replace(/<\/div>/gi, '\n');
        text = text.replace(/<\/h[1-6]>/gi, '\n');
        text = text.replace(/<[^>]*>/g, '');
        return text.trim();
    }

    /**
     * Calculate SHA-256 hash of content
     */
    calculateHash(content: string): string {
        return crypto.createHash('sha256').update(content || '').digest('hex');
    }

    /**
     * Calculate changes as hunks (Pro Diffing)
     * Returns structured hunks with context and section headers
     */
    async calculateHunks(oldContent: string, newContent: string): Promise<ChangeHunkResult> {
        const oldText = this.stripHtml(oldContent);
        const newText = this.stripHtml(newContent);
        const contentHash = this.calculateHash(newText);

        if (oldText === newText) {
            return { hunks: [], stats: { additions: 0, deletions: 0, total: 0 }, contentHash };
        }

        // Use patch-style diffing to get logical hunks
        const patch = Diff.createPatch('content.txt', oldText, newText, '', '', { context: 5 });
        const parsedPatch = Diff.parsePatch(patch)[0];

        const hunks: Hunk[] = parsedPatch.hunks.map((h: any) => {
            const lines = h.lines.map((line: string) => {
                const typeChar = line[0];
                const content = line.substring(1);
                let type: 'added' | 'removed' | 'context' = 'context';
                if (typeChar === '+') type = 'added';
                else if (typeChar === '-') type = 'removed';
                return { type, content };
            });

            // Section Detection: Find nearest header above hunk
            const sectionTitle = this.detectSection(oldText, h.oldStart);

            return {
                sectionTitle,
                oldStart: h.oldStart,
                newStart: h.newStart,
                oldLines: h.oldLines,
                newLines: h.newLines,
                lines
            };
        });

        const stats = {
            additions: hunks.reduce((acc, h) => acc + h.lines.filter(l => l.type === 'added').length, 0),
            deletions: hunks.reduce((acc, h) => acc + h.lines.filter(l => l.type === 'removed').length, 0),
            total: hunks.length
        };

        return { hunks, stats, contentHash };
    }

    /**
     * Finds the nearest header (Section X:) above a given line index
     */
    private detectSection(text: string, startLine: number): string | undefined {
        const lines = text.split('\n');
        // Look back up to 50 lines for a header
        const searchRange = Math.max(0, startLine - 1);
        const lookbackLimit = Math.max(0, searchRange - 50);

        for (let i = searchRange; i >= lookbackLimit; i--) {
            const line = lines[i]?.trim();
            if (!line) continue;

            // Common legal header patterns:
            // 1. "SECTION 1: ..." 
            // 2. "1. DEFINITIONS"
            // 3. "ARTICLE IV"
            const headerRegex = /^(SECTION\s+\d+|ARTICLE\s+[IVXLC]+|\d+\.\s+[A-Z\s]{5,})/i;
            if (headerRegex.test(line)) {
                return line.length > 50 ? line.substring(0, 47) + '...' : line;
            }
        }
        return undefined;
    }

    /**
     * Escape HTML for safe display
     */
    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;',
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }
}
