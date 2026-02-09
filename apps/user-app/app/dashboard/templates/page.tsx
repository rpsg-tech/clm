'use client';

import { useState } from 'react';
import { useTemplates } from '@/lib/hooks/use-templates';
import { MaterialIcon } from '@/components/ui/material-icon';
import { Button, Skeleton } from '@repo/ui';
import { cn } from '@repo/ui';
import { CreateTemplateModal } from '@/components/contracts/create-template-modal';
import type { Template } from '@repo/types';

type TemplateRow = Template & {
  averageValue?: number;
  status?: string;
  lastModified?: string;
};

export default function TemplatesPage() {
  const { data: response, isLoading } = useTemplates();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const templates = (response?.data ?? []) as TemplateRow[];

  const formatValue = (value?: number) => {
    if (!value) return '—';
    if (value >= 10000000) {
      return `₹ ${(value / 10000000).toFixed(1)} Cr`;
    }
    if (value >= 100000) {
      return `₹ ${(value / 100000).toFixed(0)} Lakhs`;
    }
    return `₹ ${value.toLocaleString('en-IN')}`;
  };

  const getRelativeTime = (date?: string) => {
    if (!date) return '—';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Template Library</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage contract templates and their configurations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <MaterialIcon name="upload" size={18} />
              Import
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <MaterialIcon name="add" size={18} />
              New Template
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-neutral-100 p-4 mb-4">
                <MaterialIcon name="description" size={32} className="text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No templates yet</h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-md">
                Get started by creating your first contract template. Templates help standardize
                your contract creation process.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <MaterialIcon name="add" size={18} />
                Create Template
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Template Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Avg. Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {templates.map((template) => (
                  <tr
                    key={template.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-neutral-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">{template.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-600">
                        {formatValue(template.averageValue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          template.status === 'Active' &&
                            'bg-green-100 text-green-800',
                          template.status === 'Draft' &&
                            'bg-yellow-100 text-yellow-800'
                        )}
                      >
                        {template.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">
                        {getRelativeTime(template.lastModified)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          // Refetch templates would happen here
        }}
      />
    </>
  );
}
