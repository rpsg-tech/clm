import { Injectable } from '@nestjs/common';
import * as DiffLib from 'diff';

// Handle ESM/CJS interop for diff library
const Diff = (DiffLib as any).default || DiffLib;

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

                // Check content changes
                const oldContent = previousData.annexureData || previousData.content || '';
                const newContent = currentData.annexureData || currentData.content || '';

                if (oldContent !== newContent) {
                    const contentDiff = this.calculateContentDiff(oldContent, newContent);
                    changes.push(contentDiff);
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

        const diff = Diff.diffChars(oldText, newText);

        let additions = 0;
        let deletions = 0;

        diff.forEach((part) => {
            if (part.added) {
                additions += part.value.length;
            } else if (part.removed) {
                deletions += part.value.length;
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
        contentDiff: ContentDiff & { htmlDiff?: string };
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

        // Content diff with HTML
        const fromContent = fromVersion.annexureData || fromVersion.content || '';
        const toContent = toVersion.annexureData || toVersion.content || '';

        const contentDiff = this.calculateContentDiff(fromContent, toContent);
        const htmlDiff = this.generateHtmlDiff(fromContent, toContent);

        return {
            fieldChanges,
            contentDiff: {
                ...contentDiff,
                htmlDiff,
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
        return html.replace(/<[^>]*>/g, '').trim();
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
